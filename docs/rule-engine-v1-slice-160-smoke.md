# Rule Engine V1 Slice 160 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalDebounceOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalDebounceOverrides: { "": 100 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalDebounceOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
