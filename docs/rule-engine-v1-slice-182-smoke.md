# Rule Engine V1 Slice 182 Smoke

Goal
- Fail fast on empty signal-id keys in `signalPriorityOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalPriorityOverrides: { "": 10 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalPriorityOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
