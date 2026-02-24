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
import random
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Set

import websockets


DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
SIM_TOKENS = ("ignis", "rota", "electrum", "sanctum", "domus")


@dataclass
class SidecarState:
    running: bool = False
    backend: str = "openwakeword"
    simulate: bool = True
    clients: Set[Any] = field(default_factory=set)
    sim_task: Optional[asyncio.Task] = None
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


async def ensure_started(state: SidecarState) -> None:
    if state.running:
        return
    state.running = True
    # TODO(openwakeword-real): initialize microphone + openWakeWord model(s) and start inference loop.
    if state.simulate:
        state.sim_task = asyncio.create_task(simulation_loop(state))
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
    # TODO(openwakeword-real): stop microphone stream and inference worker.
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
        # Reserved for future detector tuning.
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
    state = SidecarState(simulate=bool(args.simulate))
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
    return p.parse_args()


if __name__ == "__main__":
    try:
        asyncio.run(main_async(parse_args()))
    except KeyboardInterrupt:
        pass

