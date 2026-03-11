# RULE ENGINE V1 - SLICE 108 SMOKE CHECKLIST

## Purpose
- Add event-level action caps via:
  - `execution.maxActionsPerEvent`
  - `sourceEventMaxActionsPerEventOverrides`

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Global action cap sanity
- Set:
  `execution.maxActionsPerEvent: 1`
  `execution.maxMatchesPerEvent: 0`
- Restart and trigger a source-event payload that can execute multiple actions.
- Confirm only one action executes for that payload.

3) Source-event override sanity
- Set:
  `execution.maxActionsPerEvent: 0`
  `sourceEventMaxActionsPerEventOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger multi-action payload on that source event.
- Confirm cap applies for that event stream.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
