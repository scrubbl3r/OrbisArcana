# Rule Engine V1 Slice 194 Smoke

## Goal
- Fail fast when `eventRuntimeBindings` inner `id` is missing or mismatched.

## Checks
- Set missing inner id:
  - `eventRuntimeBindings: { "grace": { runtime: { kind: "orb_event", event: "orb.float_grace_grant" } } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].id must be non-empty`

- Set mismatched inner id:
  - `eventRuntimeBindings: { "grace": { id: "electric_aoe", runtime: { kind: "orb_event", event: "orb.float_grace_grant" } } }`
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].id must match key (grace)`

## Cleanup
- Restore valid bindings and confirm normal startup/validation is clean again.
