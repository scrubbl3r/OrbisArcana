# Rule Engine V1 Slice 88 Smoke Checklist

## Purpose
- Add per-rule preview telemetry control via `ruleEmitPreviewMatchedOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule override sanity
- Set:
  `execution.emitPreviewMatchedEvents: true`
  `ruleEmitPreviewMatchedOverrides: { r_rota_yspin_charged: false }`
- Restart and trigger that rule; confirm `rule_engine.v1.preview_matched` is suppressed for that rule.

3) Precedence sanity
- Set global/source telemetry off but set that rule override to true.
- Confirm that rule still emits `rule_engine.v1.preview_matched`.

4) Validation sanity
- Set non-boolean value and confirm fail-fast.
- Set unknown rule id and confirm fail-fast.
