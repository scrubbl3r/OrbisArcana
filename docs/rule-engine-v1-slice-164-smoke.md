# Rule Engine V1 Slice 164 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalExecuteActionsOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalExecuteActionsOverrides: { "": false }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalExecuteActionsOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
