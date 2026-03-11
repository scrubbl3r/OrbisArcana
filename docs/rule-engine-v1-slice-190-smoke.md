# Rule Engine V1 Slice 190 Smoke

## Goal
- Fail fast on invalid `eventRuntimeBindings` keys (empty or unknown event ids).

## Checks
- Add a temporary unknown binding key:
  - `eventRuntimeBindings: { ..., "event.unknown": "..." }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings references unknown event id: event.unknown`

- Add a temporary empty binding key:
  - `eventRuntimeBindings: { ..., "": "..." }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings contains empty event id key`

## Cleanup
- Remove temporary invalid keys and confirm normal startup/validation is clean again.
