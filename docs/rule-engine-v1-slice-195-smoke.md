# Rule Engine V1 Slice 195 Smoke

## Goal
- Fail fast when top-level `eventRuntimeBindings` is not an object.

## Checks
- Set `eventRuntimeBindings` to a non-object value:
  - `eventRuntimeBindings: 1`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings must be an object when present`

## Cleanup
- Restore valid object bindings and confirm normal startup/validation is clean again.
