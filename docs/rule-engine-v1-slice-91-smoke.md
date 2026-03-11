# Rule Engine V1 Slice 91 Smoke Checklist

## Purpose
- Add per-source-event action-type gates via `sourceEventActionTypeEnabledOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source event gate sanity
- Set:
  `execution.actionTypeEnabled: { wake_win: true, event: true }`
  `sourceEventActionTypeEnabledOverrides: { "voice.spell_detected": { event: false } }`
- Restart and trigger rules from `voice.spell_detected` that include event actions.
- Confirm event actions are suppressed for that source event.

3) Precedence sanity
- Set global `execution.actionTypeEnabled.event: false` and source-event override `event: true`.
- Confirm event actions execute for that source event.

4) Validation sanity
- Set unsupported action-type key or non-boolean values and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
