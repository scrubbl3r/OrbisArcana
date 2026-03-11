# RULE ENGINE V1 - SLICE 119 SMOKE CHECKLIST

## Purpose
- Add per-source-event action-telemetry type gates via `sourceEventActionExecutedEventTypeEnabledOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source-event wake telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `execution.actionExecutedEventTypeEnabled: { wake_win: true, event: true }`
  `sourceEventActionExecutedEventTypeEnabledOverrides: { "voice.spell_detected": { wake_win: false, event: true } }`
- Restart and trigger rules with both `wake_win` and `event` actions from that source event.
- Confirm actions execute, but only `event` telemetry emits.

3) Source-event event telemetry off sanity
- Set source-event map to `{ wake_win: true, event: false }`.
- Confirm only `wake_win` telemetry emits.

4) Validation sanity
- Set unsupported keys/non-boolean values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
