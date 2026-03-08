# Rule Engine V1 Slice 176 Smoke

Goal
- Fail fast on empty signal-id keys in `signalActionExecutedEventTypeEnabledOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalActionExecutedEventTypeEnabledOverrides: { "": { wake_win: false } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
