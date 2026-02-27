openWakeWord Sidecar (Dev)

Purpose

This local Python sidecar is a development backend for the browser KWS provider.
It exposes a small WebSocket API on localhost and emits `token_detected` messages
that the receiver already knows how to parse.

Status

- This is a scaffold / protocol-compatible starter.
- It supports simulation mode out of the box.
- The real `openwakeword` inference loop is intentionally marked with TODOs.

Install (venv recommended)

```bash
cd /Users/garthwilliams/Desktop/__DEV__/OrbisArcana/tools/openwakeword-sidecar
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run (simulation mode)

```bash
python3 server.py --simulate
```

Run (Orbis Arcana manifest: auto-load your spell `.tflite`/`.onnx` files)

1. Copy exported models into:
   - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/assets/kws/openwakeword-models/`
2. Use the launcher (loads manifest + defaults):

```bash
cd /Users/garthwilliams/Desktop/__DEV__/OrbisArcana/tools/openwakeword-sidecar
./run_orbis_arcana_kws.sh
```

Notes

- Current dev manifest file:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json`
- Update the manifest model list to match the files you currently have in `/assets/kws/openwakeword-models/`.
- On desktop sidecar environments without `tflite-runtime`, prefer `.onnx` spell models for live inference.

Browser usage

- In the receiver UI:
  - `Voice Engine` -> `KWS Shadow` (or `KWS`)
  - `KWS Backend` -> `openWakeWord Sidecar`
  - Click `KWS Link On`

Protocol (WebSocket JSON)

Browser -> sidecar:
- `{ "type": "start" }`
- `{ "type": "stop" }`
- `{ "type": "ping" }`

Sidecar -> browser:
- `{ "type": "status", "running": true, "backend": "openwakeword" }`
- `{ "type": "token_detected", "token": "ignis", "confidence": 0.9, "atMs": 12345 }`
- `{ "type": "error", "message": "..." }`

Next steps (real inference)

1. Fill in the openWakeWord model loading + audio callback in `server.py`
2. Map openWakeWord labels to parser tokens (`ignis`, `rota`, etc.)
3. Run in `KWS Shadow` and tune parser timings in the receiver
