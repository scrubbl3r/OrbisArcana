# Rule Engine V1 Slice 232 Smoke

Goal
- Fail fast when nested `actionType` keys are not canonical lowercase.

Covered maps
- `ruleActionExecutedEventTypeEnabledOverrides`
- `ruleActionTypeEnabledOverrides`
- `signalActionTypeEnabledOverrides`
- `signalActionExecutedEventTypeEnabledOverrides`
- `sourceEventActionTypeEnabledOverrides`
- `sourceEventActionExecutedEventTypeEnabledOverrides`

Checks
- In each covered map, use `Event` or `Wake_Win` style key instead of lowercase canonical.
- Run config validation/startup path.
- Confirm validation includes:
  - `... action type key must be canonical lowercase: <key>`

Cleanup
- Restore keys to canonical lowercase (`event`, `wake_win`).
