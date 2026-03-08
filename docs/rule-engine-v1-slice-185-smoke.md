# Rule Engine V1 Slice 185 Smoke

Goal
- Fail fast on empty action keys in `actionArgOverrides`.

Checks
- Add a temporary empty-key entry:
  - `actionArgOverrides: { "": { ms: 123 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.actionArgOverrides contains empty action key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
