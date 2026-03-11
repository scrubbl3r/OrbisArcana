# Rule Engine V1 Slice 181 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalStopOnFirstSignalMatchPerEventOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalStopOnFirstSignalMatchPerEventOverrides: { "": true }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalStopOnFirstSignalMatchPerEventOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
