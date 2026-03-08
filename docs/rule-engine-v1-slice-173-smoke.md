# Rule Engine V1 Slice 173 Smoke

Goal
- Fail fast on empty signal-id keys in `signalEmitSourceEventSummaryOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalEmitSourceEventSummaryOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalEmitSourceEventSummaryOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
