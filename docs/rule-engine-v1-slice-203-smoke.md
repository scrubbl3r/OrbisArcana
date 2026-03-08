# Rule Engine V1 Slice 203 Smoke

Goal
- Fail fast when `where.path` is present but not a string.

Checks
- Add a temporary invalid signal `where`:
  - `where: { path: 42, gte: 100 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `signal <id> where.path must be a string`

Cleanup
- Restore `where.path` to a string and confirm normal startup/validation is clean again.
