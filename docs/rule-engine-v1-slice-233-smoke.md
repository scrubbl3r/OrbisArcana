# Rule Engine V1 Slice 233 Smoke

## Goal
- Fail fast on empty keys inside `eventRuntimeBindings` objects.

## Checks
- Add temporary invalid entries:
  - In one binding object: `{ "": 1 }`
  - In one `runtime` object: `{ "": 1 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[<id>] contains empty key`
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[<id>].runtime contains empty key`

## Cleanup
- Remove temporary empty keys and confirm clean validation/startup.
