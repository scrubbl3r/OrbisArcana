#!/usr/bin/env python3
"""
openWakeWord sidecar (dev scaffold)

Protocol-compatible local WebSocket service for the browser `openWakeWord Sidecar`
KWS backend adapter.

Simulation mode works now.
Real openWakeWord inference is intentionally left as TODOs so the detector backend
can be completed against your preferred microphone/model setup without touching the
browser/game architecture.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

import websockets


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
SIM_TOKENS = ("ignis", "rota", "electrum", "sanctum", "domus")


@dataclass
class SidecarState:
    running: bool = False
    backend: str = "openwakeword"
    simulate: bool = True
    threshold: float = 0.5
    threshold_by_token: Dict[str, float] = field(default_factory=dict)
    cooldown_ms: int = 500
    clients: Set[Any] = field(default_factory=set)
    sim_task: Optional[asyncio.Task] = None
    infer_task: Optional[asyncio.Task] = None
    audio_queue: Optional[asyncio.Queue] = None
    audio_stream: Any = None
    oww_model: Any = None
    loop: Optional[asyncio.AbstractEventLoop] = None
    model_paths: List[str] = field(default_factory=list)
    label_map: Dict[str, str] = field(default_factory=dict)
    last_emit_at_ms: Dict[str, int] = field(default_factory=dict)
    last_error: str = ""


def now_ms() -> int:
    return int(time.time() * 1000)


async def send_json(ws, payload: Dict[str, Any]) -> None:
    await ws.send(json.dumps(payload))


async def broadcast_json(state: SidecarState, payload: Dict[str, Any]) -> None:
    stale = []
    for ws in list(state.clients):
      try:
          await send_json(ws, payload)
      except Exception:
          stale.append(ws)
    for ws in stale:
        state.clients.discard(ws)


async def broadcast_status(state: SidecarState) -> None:
    await broadcast_json(
        state,
        {
            "type": "status",
            "running": state.running,
            "backend": state.backend,
            "simulate": state.simulate,
            "threshold": state.threshold,
            "cooldownMs": state.cooldown_ms,
            "atMs": now_ms(),
        },
    )


async def simulation_loop(state: SidecarState, interval_ms: int = 1200) -> None:
    try:
        while state.running and state.simulate:
            token = random.choice(SIM_TOKENS)
            await broadcast_json(
                state,
                {
                    "type": "token_detected",
                    "token": token,
                    "confidence": round(random.uniform(0.78, 0.98), 2),
                    "atMs": now_ms(),
                },
            )
            await asyncio.sleep(max(0.05, interval_ms / 1000))
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        state.last_error = str(exc)
        await broadcast_json(state, {"type": "error", "message": state.last_error, "atMs": now_ms()})


def _normalize_label(label: str, label_map: Dict[str, str]) -> str:
    raw = str(label or "").strip()
    if not raw:
        return ""
    if raw in label_map:
        return str(label_map[raw]).strip().lower()
    # Common custom-model label fallback: filename stem-like labels
    token = raw.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    token = token.rsplit(".", 1)[0]
    token = token.strip().lower().replace(" ", "_")
    if token in label_map:
        return str(label_map[token]).strip().lower()
    return token


def _threshold_for_token(state: SidecarState, token: str) -> float:
    t = str(token or "").strip().lower()
    if t and t in state.threshold_by_token:
        return max(0.0, min(1.0, float(state.threshold_by_token[t])))
    return max(0.0, min(1.0, float(state.threshold)))


async def _openwakeword_infer_loop(state: SidecarState) -> None:
    assert state.audio_queue is not None
    try:
        while state.running and not state.simulate:
            chunk = await state.audio_queue.get()
            if chunk is None:
                break
            try:
                prediction = state.oww_model.predict(chunk)
            except Exception as exc:
                state.last_error = f"oww_predict_failed:{exc}"
                await broadcast_json(state, {"type": "error", "message": state.last_error, "atMs": now_ms()})
                continue

            if not isinstance(prediction, dict):
                continue
            t_ms = now_ms()
            for raw_label, score in prediction.items():
                try:
                    conf = float(score)
                except Exception:
                    continue
                token = _normalize_label(str(raw_label), state.label_map)
                if not token:
                    continue
                if conf < _threshold_for_token(state, token):
                    continue
                last = int(state.last_emit_at_ms.get(token, 0))
                if (t_ms - last) < int(state.cooldown_ms):
                    continue
                state.last_emit_at_ms[token] = t_ms
                await broadcast_json(
                    state,
                    {
                        "type": "token_detected",
                        "token": token,
                        "confidence": round(conf, 4),
                        "atMs": t_ms,
                        "label": str(raw_label),
                    },
                )
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        state.last_error = f"oww_infer_loop_failed:{exc}"
        await broadcast_json(state, {"type": "error", "message": state.last_error, "atMs": now_ms()})


def _start_audio_stream_for_oww(state: SidecarState, sample_rate: int, blocksize: int) -> None:
    import numpy as np  # type: ignore
    import sounddevice as sd  # type: ignore

    if state.loop is None:
        raise RuntimeError("asyncio loop unavailable")
    if state.audio_queue is None:
        state.audio_queue = asyncio.Queue(maxsize=8)

    def _audio_callback(indata, frames, _time_info, status):
        if status:
            # keep non-fatal; surfaced via last_error on next loop tick if needed
            state.last_error = f"sounddevice_status:{status}"
        try:
            # sounddevice gives float32 when dtype not specified; enforce int16 stream below.
            audio = np.asarray(indata).reshape(-1).astype(np.int16, copy=False)
            state.loop.call_soon_threadsafe(_queue_audio_chunk, audio.copy())
        except Exception as exc:  # pragma: no cover (best effort callback)
            state.last_error = f"audio_callback_failed:{exc}"

    def _queue_audio_chunk(audio):
        if state.audio_queue is None:
            return
        try:
            state.audio_queue.put_nowait(audio)
        except asyncio.QueueFull:
            # Drop oldest-ish behavior: clear one and retry once
            try:
                _ = state.audio_queue.get_nowait()
            except Exception:
                pass
            try:
                state.audio_queue.put_nowait(audio)
            except Exception:
                pass

    state.audio_stream = sd.InputStream(
        samplerate=int(sample_rate),
        channels=1,
        dtype="int16",
        blocksize=int(blocksize),
        callback=_audio_callback,
    )
    state.audio_stream.start()


def _create_openwakeword_model(model_paths: List[str]):
    import openwakeword  # noqa: F401  # type: ignore
    from openwakeword.model import Model  # type: ignore

    kwargs: Dict[str, Any] = {}
    if model_paths:
        kwargs["wakeword_models"] = model_paths
    return Model(**kwargs)


def _resolve_manifest_path(base_dir: str, raw_path: str) -> str:
    p = str(raw_path or "").strip()
    if not p:
        return ""
    if os.path.isabs(p):
        return os.path.normpath(p)
    return os.path.normpath(os.path.join(base_dir, p))


def _load_manifest(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError("manifest_root_not_object")
    base_dir = os.path.dirname(os.path.abspath(path))
    out_models: List[str] = []
    out_label_map: Dict[str, str] = {}
    out_threshold_map: Dict[str, float] = {}

    for item in data.get("models", []) or []:
        if isinstance(item, str):
            model_path = _resolve_manifest_path(base_dir, item)
            if model_path:
                out_models.append(model_path)
            continue
        if not isinstance(item, dict):
            continue
        model_path = _resolve_manifest_path(base_dir, str(item.get("path", "")))
        if not model_path:
            continue
        out_models.append(model_path)
        raw_label = str(item.get("label", "") or "").strip()
        mapped_token = str(item.get("token", "") or "").strip()
        if raw_label and mapped_token:
            out_label_map[raw_label] = mapped_token
        raw_threshold = item.get("threshold", None)
        if raw_threshold is not None:
            key = str(mapped_token or raw_label or "").strip().lower()
            try:
                thr = float(raw_threshold)
                if key:
                    out_threshold_map[key] = max(0.0, min(1.0, thr))
            except Exception:
                pass

    # Optional top-level label_map for convenience.
    top_label_map = data.get("label_map", {})
    if isinstance(top_label_map, dict):
        for k, v in top_label_map.items():
            ks = str(k or "").strip()
            vs = str(v or "").strip()
            if ks and vs:
                out_label_map[ks] = vs

    top_threshold_map = data.get("threshold_map", {})
    if isinstance(top_threshold_map, dict):
        for k, v in top_threshold_map.items():
            key = str(k or "").strip().lower()
            if not key:
                continue
            try:
                thr = float(v)
            except Exception:
                continue
            out_threshold_map[key] = max(0.0, min(1.0, thr))

    return {"models": out_models, "label_map": out_label_map, "threshold_map": out_threshold_map}


async def ensure_started(state: SidecarState) -> None:
    if state.running:
        return
    state.running = True
    if state.simulate:
        state.sim_task = asyncio.create_task(simulation_loop(state))
    else:
        state.audio_queue = asyncio.Queue(maxsize=8)
        try:
            state.oww_model = _create_openwakeword_model(state.model_paths)
        except Exception as exc:
            state.running = False
            state.last_error = f"oww_model_init_failed:{exc}"
            await broadcast_json(state, {"type": "error", "message": state.last_error, "atMs": now_ms()})
            await broadcast_status(state)
            return
        try:
            _start_audio_stream_for_oww(state, sample_rate=16000, blocksize=1280)
        except Exception as exc:
            state.running = False
            state.last_error = f"oww_audio_start_failed:{exc}"
            await broadcast_json(state, {"type": "error", "message": state.last_error, "atMs": now_ms()})
            await broadcast_status(state)
            return
        state.infer_task = asyncio.create_task(_openwakeword_infer_loop(state))
    await broadcast_status(state)


async def ensure_stopped(state: SidecarState) -> None:
    state.running = False
    if state.sim_task:
        state.sim_task.cancel()
        try:
            await state.sim_task
        except Exception:
            pass
        state.sim_task = None
    if state.audio_queue:
        try:
            state.audio_queue.put_nowait(None)
        except Exception:
            pass
    if state.infer_task:
        state.infer_task.cancel()
        try:
            await state.infer_task
        except Exception:
            pass
        state.infer_task = None
    if state.audio_stream is not None:
        try:
            state.audio_stream.stop()
        except Exception:
            pass
        try:
            state.audio_stream.close()
        except Exception:
            pass
        state.audio_stream = None
    state.audio_queue = None
    state.oww_model = None
    await broadcast_status(state)


async def handle_message(state: SidecarState, ws, raw: str) -> None:
    try:
        msg = json.loads(raw)
    except Exception:
        await send_json(ws, {"type": "error", "message": "bad_json", "atMs": now_ms()})
        return
    msg_type = str(msg.get("type", "")).strip().lower()
    if msg_type == "ping":
        await send_json(ws, {"type": "status", "running": state.running, "backend": state.backend, "simulate": state.simulate, "atMs": now_ms()})
        return
    if msg_type == "start":
        await ensure_started(state)
        return
    if msg_type == "stop":
        await ensure_stopped(state)
        return
    if msg_type == "set_config":
        if "threshold" in msg:
            try:
                state.threshold = max(0.0, min(1.0, float(msg["threshold"])))
            except Exception:
                pass
        if "cooldownMs" in msg:
            try:
                state.cooldown_ms = max(0, int(msg["cooldownMs"]))
            except Exception:
                pass
        await send_json(ws, {"type": "status", "running": state.running, "backend": state.backend, "simulate": state.simulate, "atMs": now_ms()})
        return
    await send_json(ws, {"type": "error", "message": f"unknown_message_type:{msg_type or 'empty'}", "atMs": now_ms()})


async def ws_handler(ws, state: SidecarState):
    state.clients.add(ws)
    await send_json(ws, {"type": "status", "running": state.running, "backend": state.backend, "simulate": state.simulate, "atMs": now_ms()})
    try:
        async for raw in ws:
            await handle_message(state, ws, raw)
    finally:
        state.clients.discard(ws)


async def main_async(args):
    manifest_models: List[str] = []
    manifest_label_map: Dict[str, str] = {}
    manifest_threshold_map: Dict[str, float] = {}
    if args.manifest:
        loaded = _load_manifest(str(args.manifest))
        manifest_models = list(loaded.get("models", []) or [])
        manifest_label_map = dict(loaded.get("label_map", {}) or {})
        manifest_threshold_map = dict(loaded.get("threshold_map", {}) or {})

    cli_models = list(args.model or [])
    cli_label_map = _parse_label_map_arg(args.label_map or [])
    cli_threshold_map = _parse_threshold_map_arg(args.token_threshold or [])
    model_paths = manifest_models + cli_models
    label_map = {**manifest_label_map, **cli_label_map}
    threshold_by_token = {**manifest_threshold_map, **cli_threshold_map}
    state = SidecarState(
        simulate=bool(args.simulate),
        threshold=float(args.threshold),
        threshold_by_token=threshold_by_token,
        cooldown_ms=int(args.cooldown_ms),
        model_paths=model_paths,
        label_map=label_map,
    )
    state.loop = asyncio.get_running_loop()
    print(f"[oww-sidecar] listening on ws://{args.host}:{args.port} (simulate={state.simulate})")
    async with websockets.serve(lambda ws: ws_handler(ws, state), args.host, args.port, ping_interval=20, ping_timeout=20):
        try:
            await asyncio.Future()
        finally:
            await ensure_stopped(state)


def parse_args():
    p = argparse.ArgumentParser(description="openWakeWord KWS sidecar (dev scaffold)")
    p.add_argument("--host", default=DEFAULT_HOST)
    p.add_argument("--port", type=int, default=DEFAULT_PORT)
    p.add_argument("--simulate", action="store_true", help="emit simulated token detections")
    p.add_argument("--manifest", default="", help="Path to JSON manifest listing models and optional label mappings")
    p.add_argument("--model", action="append", default=[], help="Path to openWakeWord model file (.tflite/.onnx), repeatable")
    p.add_argument("--threshold", type=float, default=0.5, help="Detection threshold (0..1)")
    p.add_argument("--cooldown-ms", type=int, default=500, help="Per-token duplicate suppression in ms")
    p.add_argument(
        "--label-map",
        action="append",
        default=[],
        help="Map model label to parser token, format LABEL=token (repeatable)",
    )
    p.add_argument(
        "--token-threshold",
        action="append",
        default=[],
        help="Per-token threshold override, format token=0.35 (repeatable)",
    )
    return p.parse_args()


def _parse_label_map_arg(items: List[str]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for item in items or []:
        raw = str(item or "")
        if "=" not in raw:
            continue
        k, v = raw.split("=", 1)
        k = k.strip()
        v = v.strip()
        if not k or not v:
            continue
        out[k] = v
    return out


def _parse_threshold_map_arg(items: List[str]) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for item in items or []:
        raw = str(item or "")
        if "=" not in raw:
            continue
        k, v = raw.split("=", 1)
        key = k.strip().lower()
        if not key:
            continue
        try:
            thr = float(v.strip())
        except Exception:
            continue
        out[key] = max(0.0, min(1.0, thr))
    return out


if __name__ == "__main__":
    try:
        asyncio.run(main_async(parse_args()))
    except KeyboardInterrupt:
        pass
