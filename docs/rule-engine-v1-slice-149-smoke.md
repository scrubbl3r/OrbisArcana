# Rule Engine V1 Slice 149 Smoke

Goal
- Fail fast on empty rule-id keys in `ruleCooldownScaleOverrides`.

Checks
- Add a temporary empty-key entry:
  - `ruleCooldownScaleOverrides: { "": 0.5 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleCooldownScaleOverrides contains empty rule id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
