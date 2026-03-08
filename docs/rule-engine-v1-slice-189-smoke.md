# Rule Engine V1 Slice 189 Smoke

Goal
- Fail fast on empty window-id keys in `windowDefaultOverrides`.

Checks
- Add a temporary empty-key entry:
  - `windowDefaultOverrides: { "": { ttlMs: 1000 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.windowDefaultOverrides contains empty window id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
