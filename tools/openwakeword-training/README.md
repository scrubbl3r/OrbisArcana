openWakeWord Training Pipeline (v1)

Purpose

This directory is the training/export workstream for custom KWS token models used by
Orbis Arcana spellcasting (for example `ignis`, `rota`, `electrum`).

Important separation of concerns

- Training/export happens here (Python / notebooks / model assets)
- Runtime inference happens in:
  - `tools/openwakeword-sidecar/` (dev sidecar)
  - later: browser-native backend (optional)
- Gameplay parsing/casting happens in the game (`kws-token-parser`, spell systems)

This keeps the game runtime simple and the KWS model pipeline versionable.

Status

- This is a scaffold and process guide
- The actual model training can be done via the official `openWakeWord` notebooks / scripts
- Output models should be copied into the project asset folder for the sidecar/runtime

References

- openWakeWord README:
  - https://github.com/dscripka/openWakeWord
- openWakeWord training section:
  - https://github.com/dscripka/openWakeWord?tab=readme-ov-file#training-new-models

Recommended workflow (v1)

1. Train one token at a time
- Start with `ignis`
- Then `rota`
- Validate in sidecar + `KWS Shadow`

2. Export model(s)
- Export to a stable, versioned local file (ONNX preferred for Python sidecar runtime unless your workflow produces another supported format)

3. Copy exported models into:
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/assets/kws/openwakeword-models/`

4. Run the sidecar with the model(s)
- `tools/openwakeword-sidecar/server.py`
- Verify detections in receiver `KWS Shadow`

5. Tune thresholds / cooldowns
- In the receiver KWS tuning panel
- In sidecar args (`--threshold`, `--cooldown-ms`) if needed

Directory conventions (v1)

- `notes/`
  - training notes, results, threshold observations
- `manifests/`
  - model registry files / label maps (future)
- `exports/`
  - optional temporary exports before promoting into `assets/kws/openwakeword-models/`

Model naming conventions (important)

Use stable token-first names so the sidecar label mapping is simple.

Recommended filenames:
- `ignis.onnx`
- `rota.onnx`
- `electrum.onnx`
- `sanctum.onnx`
- `sanctus.onnx`
- `domus.onnx`
- `radius.onnx`
- `rahta.onnx`
- `fridgis.onnx`

If your training tool exports different filenames/labels:
- keep the original file if needed
- map labels to parser tokens in the sidecar using:
  - `--label-map LABEL=token`

First token plan (v1)

Phase A: `ignis`
- Train/export `ignis`
- Run sidecar in real mode with one model
- Verify token detections in `KWS Shadow`

Phase B: `rota`
- Train/export `rota`
- Run sidecar with both models
- Verify token chaining -> `ignis rota` in `KWS Shadow`

Phase C: activate
- Switch receiver to `KWS`
- Validate real spell cast path

Suggested sidecar test commands

Single token:

```bash
cd /Users/garthwilliams/Desktop/__DEV__/OrbisArcana/tools/openwakeword-sidecar
source .venv/bin/activate
python3 server.py \
  --model /Users/garthwilliams/Desktop/__DEV__/OrbisArcana/assets/kws/openwakeword-models/ignis.onnx \
  --threshold 0.5 \
  --cooldown-ms 500
```

Two tokens:

```bash
python3 server.py \
  --model /Users/garthwilliams/Desktop/__DEV__/OrbisArcana/assets/kws/openwakeword-models/ignis.onnx \
  --model /Users/garthwilliams/Desktop/__DEV__/OrbisArcana/assets/kws/openwakeword-models/rota.onnx \
  --threshold 0.5 \
  --cooldown-ms 500
```

If exported labels differ:

```bash
python3 server.py \
  --model /.../ignis_model.onnx \
  --model /.../rota_model.onnx \
  --label-map IgnisWake=ignis \
  --label-map RotaWake=rota
```

What not to do (yet)

- Do not build the training UI inside the game/receiver
- Do not mix training logic into `tools/openwakeword-sidecar/`
- Do not train all spell tokens at once before validating the first two

Next implementation queue items (after first real model works)

1. `tools/openwakeword-training/manifests/models.manifest.json` (schema)
2. Sidecar support for `--manifest`
3. Runtime model registry/docs
4. Browser-native backend evaluation (later)

