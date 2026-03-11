# Rule Engine V1 Slice 192 Smoke

## Goal
- Fail fast on unknown keys inside `eventRuntimeBindings[<eventId>].runtime`.

## Checks
- Add a temporary unknown runtime key:
  - `eventRuntimeBindings: { "grace": { runtime: { kind: "orb_event", event: "orb.float_grace_grant", bogus: 1 } } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings[grace].runtime contains unknown key: bogus`

## Cleanup
- Remove the temporary unknown key and confirm normal startup/validation is clean again.
