# Rule Engine V1 Slice 174 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalSummaryIncludeSignalAndRuleIdsOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalSummaryIncludeSignalAndRuleIdsOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalSummaryIncludeSignalAndRuleIdsOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
