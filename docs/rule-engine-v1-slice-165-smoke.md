# Rule Engine V1 Slice 165 Smoke

## Goal
- Fail fast on empty signal-id keys in `signalActionTypeEnabledOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `signalActionTypeEnabledOverrides: { "": { event: false } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalActionTypeEnabledOverrides contains empty signal id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
