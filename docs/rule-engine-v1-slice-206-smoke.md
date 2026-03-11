# Rule Engine V1 Slice 206 Smoke

## Goal
- Fail fast when numeric `where` bounds are reversed.

## Checks
- Add a temporary invalid signal `where`:
  - `where: { path: "ms", gte: 900, lte: 200 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `signal <id> where lower bound cannot be greater than upper bound`

## Cleanup
- Restore bounds so lower <= upper and confirm clean validation/startup.
