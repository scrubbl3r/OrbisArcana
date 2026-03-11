# Rule Engine V1 Slice 197 Smoke

## Goal
- Ensure `eventRuntimeBindings missing id` uses key presence, not truthiness.

## Checks
- Set a present but malformed binding key:
  - `eventRuntimeBindings: { "grace": null, ... }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace] must be an object`
- Confirm it does **not** incorrectly report:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings missing id: grace`

## Cleanup
- Restore valid bindings and confirm normal startup/validation is clean again.
