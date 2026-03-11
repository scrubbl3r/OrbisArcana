# Rule Engine V1 Slice 154 Smoke

## Goal
- Fail fast on empty rule-id keys in `ruleSummaryIncludeSignalAndRuleIdsOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `ruleSummaryIncludeSignalAndRuleIdsOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleSummaryIncludeSignalAndRuleIdsOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
