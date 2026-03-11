# Rule Engine V1 Slice 178 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalMaxSignalsPerEventOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalMaxSignalsPerEventOverrides: { "": 1 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalMaxSignalsPerEventOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
