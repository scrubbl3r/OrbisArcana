# Rule Engine V1 Slice 193 Smoke

Goal
- Fail fast when `eventRuntimeBindings.runtime` mixes `orb_event` and `cast_action` fields.

Checks
- Set mixed fields for `orb_event`:
  - `eventRuntimeBindings: { "grace": { runtime: { kind: "orb_event", event: "orb.float_grace_grant", castActionId: "aoe_electric" } } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime.castActionId must be omitted for kind orb_event`

- Set mixed fields for `cast_action`:
  - `eventRuntimeBindings: { "electric_aoe": { runtime: { kind: "cast_action", castActionId: "aoe_electric", event: "orb.state_set" } } }`
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[electric_aoe].runtime.event must be omitted for kind cast_action`

Cleanup
- Restore valid bindings and confirm normal startup/validation is clean again.
