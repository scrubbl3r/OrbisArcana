# Rule Engine V1 Slice 121 Smoke Checklist

## Purpose
- Add rule-level action-telemetry type gates via `ruleActionExecutedEventTypeEnabledOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule wake telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `execution.actionExecutedEventTypeEnabled: { wake_win: true, event: true }`
  `sourceEventActionExecutedEventTypeEnabledOverrides: { "voice.spell_detected": { wake_win: true, event: true } }`
  `signalActionExecutedEventTypeEnabledOverrides: { "spell.rota": { wake_win: true, event: true } }`
  `ruleActionExecutedEventTypeEnabledOverrides: { "r1": { wake_win: false, event: true } }`
- Restart and trigger rule `r1` with both action types.
- Confirm only `event` telemetry emits for `r1`.

3) Precedence sanity
- Keep rule map above while signal/source/global are fully true.
- Confirm rule-level value wins.

4) Validation sanity
- Set unsupported keys/non-boolean values; confirm fail-fast.
- Set unknown rule id; confirm fail-fast.
