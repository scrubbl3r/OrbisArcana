# Rule Engine V1 Slice 93 Smoke Checklist

## Purpose
- Add per-source-event action execution control via `sourceEventExecuteActionsOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source event dry-run sanity
- Set:
  `execution.executeActions: true`
  `sourceEventExecuteActionsOverrides: { "voice.spell_detected": false }`
- Restart and trigger rules from `voice.spell_detected`.
- Confirm matches still occur but actions do not execute for that source event.

3) Global dominance sanity
- Set global `execution.executeActions: false` and source-event override to true.
- Confirm actions still do not execute.

4) Validation sanity
- Set non-boolean value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
