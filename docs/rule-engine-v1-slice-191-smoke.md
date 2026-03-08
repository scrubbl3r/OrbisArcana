# Rule Engine V1 Slice 191 Smoke

Goal
- Fail fast on malformed `eventRuntimeBindings` value shape.

Checks
- Set a binding with missing runtime object:
  - `eventRuntimeBindings: { "grace": {} }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime must be an object`

- Set invalid runtime kind:
  - `eventRuntimeBindings: { "grace": { runtime: { kind: "noop" } } }`
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime.kind must be one of: orb_event, cast_action`

- Set missing required field by kind:
  - `eventRuntimeBindings: { "grace": { runtime: { kind: "orb_event", event: "" } } }`
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime.event must be non-empty for kind orb_event`

Cleanup
- Restore valid bindings and confirm normal startup/validation is clean again.
