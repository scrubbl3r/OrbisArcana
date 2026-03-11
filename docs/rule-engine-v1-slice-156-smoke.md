# Rule Engine V1 Slice 156 Smoke

## Goal
- Fail fast on empty rule-id keys in `ruleActionExecutedEventTypeEnabledOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `ruleActionExecutedEventTypeEnabledOverrides: { "": { wake_win: false } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
