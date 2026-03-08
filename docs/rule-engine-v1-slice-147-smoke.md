# Rule Engine V1 Slice 147 Smoke

Goal
- Fail fast on empty rule-id keys in `ruleTimingOverrides`.

Checks
- Add a temporary empty-key entry:
  - `ruleTimingOverrides: { "": { cooldownMs: 250 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides contains empty rule id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
