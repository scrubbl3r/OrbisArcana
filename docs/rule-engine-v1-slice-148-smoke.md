# Rule Engine V1 Slice 148 Smoke

## Goal
- Fail fast on empty rule-id keys in `ruleActionLimitOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `ruleActionLimitOverrides: { "": 1 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleActionLimitOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
