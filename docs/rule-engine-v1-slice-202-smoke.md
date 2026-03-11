# Rule Engine V1 Slice 202 Smoke

## Goal
- Fail fast on unsupported keys in `where` clauses.

## Checks
- Add a temporary unsupported key in a signal `where`:
  - `where: { path: "ms", gte: 100, foo: 1 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `signal <id> where has unsupported key: foo`

## Cleanup
- Remove the unsupported key and confirm normal startup/validation is clean again.
