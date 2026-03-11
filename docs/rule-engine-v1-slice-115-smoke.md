# RULE ENGINE V1 - SLICE 115 SMOKE CHECKLIST

## Purpose
- Add per-source-event action telemetry overrides via `sourceEventEmitActionExecutedOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source-event action telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `sourceEventEmitActionExecutedOverrides: { "voice.spell_detected": false }`
- Restart and trigger action-producing rules from that source event.
- Confirm actions still execute but no `rule_engine.v1.action_executed` telemetry emits for that source event.

3) Source-event action telemetry on sanity
- Set:
  `sourceEventEmitActionExecutedOverrides: { "voice.spell_detected": true }`
- Confirm action telemetry emits again.

4) Validation sanity
- Set non-boolean values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
