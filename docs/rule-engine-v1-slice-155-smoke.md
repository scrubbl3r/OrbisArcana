# Rule Engine V1 Slice 155 Smoke

## Goal
- Fail fast on empty rule-id keys in `ruleSummaryIncludeBudgetCapsOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `ruleSummaryIncludeBudgetCapsOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleSummaryIncludeBudgetCapsOverrides contains empty rule id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
