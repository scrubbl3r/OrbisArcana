# Rule Engine V1 Slice 143 Smoke

Goal
- Fail fast on unknown keys inside `signalWhereOverrides[signalId]`.

Checks
- Add a temporary unknown key under an existing signal override:
  - `signalWhereOverrides: { "orb_state.charged": { path: "ms", gte: 100, bogusWhere: 1 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[orb_state.charged] contains unknown key: bogusWhere`

Cleanup
- Remove `bogusWhere` and confirm normal startup/validation is clean again.
