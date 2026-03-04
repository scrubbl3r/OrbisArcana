# openWakeWord JS/WASM Migration Plan (v1)

Date: 2026-03-04  
Branch: `JS-WSAM-refactor-v1`

## Goal
Replace the local Python openWakeWord sidecar runtime with a browser-native JS/WASM runtime while preserving the existing KWS provider/parser/game event contracts.

## Scope Constraints
- Target platform: desktop/laptop only (roughly <= 5-6 years old).
- No mobile optimization work in v1.
- Keep game main-thread load low; inference must run off the main thread.
- Do not require WASM multithreading in v1.

## Architecture Contract (must remain stable)
- Provider contract: `start()`, `stop()`, `destroy()`, `getStatus()`
- Token event: `{ token, confidence, atMs }`
- Parser/game contract remains unchanged.
- Sidecar backend remains available as fallback during rollout.

## Slice Plan
1. Slice 0: Baseline + flags
- Keep `openwakeword_sidecar` as default backend.
- Add browser backend key `openwakeword_browser`.
- Add simple backend selection override via URL param `?kwsBackend=...`.
- Define observability fields required from backend status.

2. Slice 1: Browser backend scaffold
- Add `openwakeword-browser-config.js`.
- Add `openwakeword-browser-backend.js` with provider-compatible shape.
- Wire into receiver bootstrap and backend registry.
- Optional simulation mode for contract testing.

3. Slice 2: Model manifest + asset loader
- Reuse training manifest structure (`models[]`, `label_map`, `threshold_map`).
- Resolve `.onnx` + `.onnx.data` assets in browser.
- Validate missing assets early with structured errors.

4. Slice 3: Audio capture pipeline
- Mic stream -> `AudioWorklet` or `ScriptProcessor` fallback -> Worker queue.
- Normalize to mono 16k framed chunks.
- Add counters: chunk rate, queue depth, drops.

5. Slice 4: ONNX runtime integration
- Add `onnxruntime-web` inference worker.
- Start with one keyword model (`ignis`) and verify token path end-to-end.
- Keep runtime single-threaded.

6. Slice 5: Detection parity
- Port token normalization, per-token threshold overrides, cooldown suppression.
- Match sidecar payload semantics and status reporting.

7. Slice 6: Multi-model support
- Load active spell model set from manifest.
- Run per-model scores and emit first-passing or best-passing token.
- Expose active model count and per-model load status.

8. Slice 7: Performance tuning
- Profile on target desktop/laptop hardware.
- Tune chunk size, queue limits, and threshold defaults.
- Gate regression: no visible frame stutter, stable detection latency.

9. Slice 8: Rollout
- Shadow mode first, then active mode.
- Keep sidecar fallback for one release window.
- Retire sidecar only after parity and stability targets are met.

## Definition of Done (for each slice)
- Implemented behind explicit backend selection.
- Emits structured status and error fields.
- Includes manual test notes and pass/fail checklist.
- No regressions to parser/gameplay event flow.

## Immediate Next Steps
1. Complete Slice 1 scaffold wiring (this commit).
2. Build Slice 2 manifest loader with validation errors.
3. Implement Slice 3 workerized audio framing.
