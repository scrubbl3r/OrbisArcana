# RULE ENGINE V1 - SLICE 76 SMOKE CHECKLIST

## Purpose
- Add telemetry toggle via `execution.emitPreviewMatchedEvents`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default telemetry sanity
- Keep `execution.emitPreviewMatchedEvents: true`.
- Confirm `rule_engine.v1.preview_matched` telemetry emits normally.

3) Telemetry off sanity
- Set `execution.emitPreviewMatchedEvents: false`.
- Restart and confirm `rule_engine.v1.preview_matched` no longer emits.
- Confirm action execution behavior remains intact.

4) Validation sanity
- Set non-boolean value and confirm config fail-fast.
