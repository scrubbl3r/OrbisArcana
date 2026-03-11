# Rule Engine V1 Slice 172 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalEmitActionExecutedOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalEmitActionExecutedOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalEmitActionExecutedOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
