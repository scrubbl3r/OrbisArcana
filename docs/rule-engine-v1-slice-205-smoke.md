# Rule Engine V1 Slice 205 Smoke

Goal
- Fail fast when `where.eq` is explicitly undefined.

Checks
- Add a temporary invalid signal `where`:
  - `where: { path: "orb.energy", eq: undefined }`
- Run config validation/startup path.
- Confirm validation includes:
  - `signal <id> where.eq must not be undefined`

Cleanup
- Set `eq` to a concrete value (or remove it) and confirm clean validation/startup.
