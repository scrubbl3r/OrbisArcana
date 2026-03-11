# Rule Engine V1 Slice 140 Smoke

## Goal
- Fail fast on unknown config keys at top-level and inside `execution`.

## Checks
- Add a temporary top-level key:
  - `bogusTopLevel: true`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL contains unknown top-level key: bogusTopLevel`

- Remove `bogusTopLevel`, then add a temporary execution key:
  - `execution: { ..., bogusExec: 1 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.execution contains unknown key: bogusExec`

## Cleanup
- Remove both temporary keys and confirm normal startup/validation is clean again.
