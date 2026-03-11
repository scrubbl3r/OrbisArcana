# Rule Engine V1 Slice 150 Smoke

## Goal
- Fail fast on empty rule-id keys in `ruleMatchWindowScaleOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `ruleMatchWindowScaleOverrides: { "": 0.8 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleMatchWindowScaleOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
