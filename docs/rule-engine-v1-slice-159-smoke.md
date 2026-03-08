# Rule Engine V1 Slice 159 Smoke

Goal
- Fail fast on empty signal-id keys in `signalEnabledOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalEnabledOverrides: { "": false }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalEnabledOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
