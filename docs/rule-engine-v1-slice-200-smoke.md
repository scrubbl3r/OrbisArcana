# Rule Engine V1 Slice 200 Smoke

## Goal
- Fail fast on non-string `eventRuntimeBindings[...].runtime.kind`.

## Checks
- Set non-string runtime kind:
  - `eventRuntimeBindings: { "grace": { id: "grace", runtime: { kind: 1, event: "orb.float_grace_grant" } } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime.kind must be a string when present`

## Cleanup
- Restore valid string `runtime.kind` and confirm normal startup/validation is clean again.
