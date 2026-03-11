# Rule Engine V1 Slice 152 Smoke

## Goal
- Fail fast on empty rule-id keys in `ruleEmitActionExecutedOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `ruleEmitActionExecutedOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleEmitActionExecutedOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
