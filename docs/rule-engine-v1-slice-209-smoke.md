# Rule Engine V1 Slice 209 Smoke

Goal
- Fail fast on ambiguous numeric comparators in `signalWhereOverrides`.

Checks
- Add temporary invalid override:
  - `signalWhereOverrides: { "<signal_id>": { path: "ms", gt: 100, gte: 100 } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>] cannot combine gt and gte`

- Repeat with:
  - `signalWhereOverrides: { "<signal_id>": { path: "ms", lt: 1000, lte: 1000 } }`
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>] cannot combine lt and lte`

Cleanup
- Keep one lower-bound comparator and one upper-bound comparator only.
