# Rule Engine V1 Slice 196 Smoke

Goal
- Fail fast on unknown top-level keys inside `eventRuntimeBindings[<eventId>]`.

Checks
- Add a temporary unknown binding key:
  - `eventRuntimeBindings: { "grace": { id: "grace", runtime: { kind: "orb_event", event: "orb.float_grace_grant" }, bogus: 1 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace] contains unknown key: bogus`

Cleanup
- Remove the temporary unknown key and confirm normal startup/validation is clean again.
