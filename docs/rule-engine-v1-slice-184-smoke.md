# Rule Engine V1 Slice 184 Smoke

Goal
- Fail fast on empty action keys in `actionEnabledOverrides`.

Checks
- Add a temporary empty-key entry:
  - `actionEnabledOverrides: { "": false }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.actionEnabledOverrides contains empty action key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
