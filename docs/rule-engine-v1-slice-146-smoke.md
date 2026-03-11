# Rule Engine V1 Slice 146 Smoke

## Goal
- Fail fast on empty rule-id keys in `rulePriorityOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `rulePriorityOverrides: { "": 50 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.rulePriorityOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
