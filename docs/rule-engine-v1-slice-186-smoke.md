# Rule Engine V1 Slice 186 Smoke

## Goal
- Fail fast on empty event-id keys in `eventEnabledOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `eventEnabledOverrides: { "": false }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventEnabledOverrides contains empty event id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
