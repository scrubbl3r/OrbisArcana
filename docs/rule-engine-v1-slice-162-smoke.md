# Rule Engine V1 Slice 162 Smoke

Goal
- Fail fast on empty signal-id keys in `signalEmitPreviewMatchedOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalEmitPreviewMatchedOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalEmitPreviewMatchedOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
