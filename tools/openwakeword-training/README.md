openWakeWord Training Pipeline (v2)

Purpose

This directory is the training/export workstream for custom KWS token models used by
Orbis Arcana spellcasting (for example `tempus`, `rota`, `electrum`).

Separation of concerns

- Training/export happens here (Python notebooks / model assets)
- Runtime inference happens in the browser openWakeWord JS/WASM backend
- Gameplay parsing/casting happens in the game (`kws-token-parser`, spell systems)

Status

- Browser runtime is the production path
- Exported models should be copied into:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/assets/kws/openwakeword-models/`
- Active manifest:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/tools/openwakeword-training/manifests/orbis-arcana-dev-spells.manifest.json`

References

- openWakeWord README:
  - https://github.com/dscripka/openWakeWord
- openWakeWord training section:
  - https://github.com/dscripka/openWakeWord?tab=readme-ov-file#training-new-models

Recommended workflow

1. Train one token at a time (start with highest-value token).
2. Export ONNX model (+ `.onnx.data` when applicable).
3. Copy model files into `assets/kws/openwakeword-models/`.
4. Update manifest entries (`path`, `label`, `token`).
5. Validate in receiver using `openWakeWord Browser (WSAM)` backend.
6. Tune thresholds/cooldowns in receiver KWS tuning panel.

Canonical token set

- `orbis`
- `domus`
- `tempus`
- `fridgis`
- `electrum`
- `rota`
- `sanctum`
- `vectus`

Notes

- Keep token names canonical in manifest/runtime; pronunciation variants should stay in token maps/aliases.
- Do not mix training logic into game runtime code.
