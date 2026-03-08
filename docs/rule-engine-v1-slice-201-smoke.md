# Rule Engine V1 Slice 201 Smoke

Goal
- Fail fast when `eventRuntimeBindings[...].runtime.kind` is missing/empty.

Checks
- Set missing runtime kind:
  - `eventRuntimeBindings: { "grace": { id: "grace", runtime: { event: "orb.float_grace_grant" } } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime.kind is required`

- Set empty runtime kind:
  - `eventRuntimeBindings: { "grace": { id: "grace", runtime: { kind: "", event: "orb.float_grace_grant" } } }`
- Confirm the same required error.

Cleanup
- Restore valid non-empty `runtime.kind` and confirm normal startup/validation is clean again.
