# Rule Engine V1 Slice 167 Smoke

Goal
- Fail fast on empty signal-id keys in `signalCooldownScaleOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalCooldownScaleOverrides: { "": 0.5 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalCooldownScaleOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
