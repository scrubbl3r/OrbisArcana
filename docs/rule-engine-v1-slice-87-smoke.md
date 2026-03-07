RULE ENGINE V1 - SLICE 87 SMOKE CHECKLIST

Purpose
- Add per-source-event preview telemetry control via `sourceEventEmitPreviewMatchedOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.emitPreviewMatchedEvents: true`
  `sourceEventEmitPreviewMatchedOverrides: { "voice.spell_detected": false }`
- Restart and trigger rule matches from `voice.spell_detected`.
- Confirm `rule_engine.v1.preview_matched` does not emit for that source event.

3) Precedence sanity
- Set global to `false` and set that source event override to `true`.
- Confirm preview events emit for that source event.

4) Validation sanity
- Set non-boolean value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
