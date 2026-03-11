# openWakeWord JS/WASM Migration Plan

Date: 2026-03-05  
Branch: `JS-WASM-refactor`

## Outcome
Migration completed: browser-native openWakeWord JS/WASM is the active KWS runtime.
Legacy Python sidecar and Porcupine paths were decommissioned from receiver runtime wiring.

## Active Runtime Contract
- Provider contract: `start()`, `stop()`, `destroy()`, `getStatus()`
- Token event: `{ token, confidence, atMs }`
- Parser/game spell contracts unchanged
- Backend: `openwakeword_browser`

## Key Runtime Characteristics
- Desktop/laptop target only
- Worker-based audio + inference pipeline
- ONNX Runtime Web (self-hosted assets)
- Multi-model inference from manifest model set
- Runtime tuning via UI (no URL-param tuning path)

## Canonical Token Set
- `orbis`
- `domus`
- `tempus`
- `fridgis`
- `electrum`
- `rota`
- `sanctum`
- `vectus`

## Follow-up Hardening Queue
1. Final dead-file cleanup pass (docs/assets) after release verification.
2. Runtime SSOT consolidation for thresholds/tuning config.
3. Startup UX polish (loading indicator + readiness states).
