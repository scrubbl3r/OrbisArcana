# Rule Engine V1 Slice 187 Smoke

## Goal
- Fail fast on empty event-id keys in `eventDefaultOverrides`.

## Checks
- Add a temporary empty-key entry:
  - `eventDefaultOverrides: { "": { ms: 250 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventDefaultOverrides contains empty event id key`

## Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
