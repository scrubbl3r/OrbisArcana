# Rule Engine V1 Slice 171 Smoke

Goal
- Fail fast on empty signal-id keys in `signalMaxActionsPerSignalOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalMaxActionsPerSignalOverrides: { "": 1 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalMaxActionsPerSignalOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
