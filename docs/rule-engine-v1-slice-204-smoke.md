# Rule Engine V1 Slice 204 Smoke

## Goal
- Fail fast on ambiguous numeric bounds in `where`.

## Checks
- Add a temporary invalid signal `where`:
  - `where: { path: "ms", gt: 100, gte: 100 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `signal <id> where.gt and where.gte cannot be combined`

- Repeat with:
  - `where: { path: "ms", lt: 1000, lte: 1000 }`
- Confirm validation includes:
  - `signal <id> where.lt and where.lte cannot be combined`

## Cleanup
- Keep only one lower bound and one upper bound comparator as needed.
