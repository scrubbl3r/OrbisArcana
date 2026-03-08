# Rule Engine V1 Slice 144 Smoke

Goal
- Fail fast on empty signal-id keys in `signalWhereOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalWhereOverrides: { "": { path: "ms", gte: 100 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
