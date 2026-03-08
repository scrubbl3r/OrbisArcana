# Rule Engine V1 Slice 188 Smoke

Goal
- Fail fast on empty window-id keys in `windowEnabledOverrides`.

Checks
- Add a temporary empty-key entry:
  - `windowEnabledOverrides: { "": false }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.windowEnabledOverrides contains empty window id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
