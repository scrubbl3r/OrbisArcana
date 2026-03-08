# Rule Engine V1 Slice 199 Smoke

Goal
- Fail fast on non-string `eventRuntimeBindings` string fields.

Checks
- Set non-string binding id:
  - `eventRuntimeBindings: { "grace": { id: 123, runtime: { kind: "orb_event", event: "orb.float_grace_grant" } } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].id must be a string`

- Set non-string runtime field:
  - `eventRuntimeBindings: { "grace": { id: "grace", runtime: { kind: "orb_event", event: 42 } } }`
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime.event must be a string when present`

Cleanup
- Restore valid string fields and confirm normal startup/validation is clean again.
