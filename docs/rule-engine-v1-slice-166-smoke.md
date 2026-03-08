# Rule Engine V1 Slice 166 Smoke

Goal
- Fail fast on empty signal-id keys in `signalMatchWindowScaleOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalMatchWindowScaleOverrides: { "": 0.8 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalMatchWindowScaleOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
