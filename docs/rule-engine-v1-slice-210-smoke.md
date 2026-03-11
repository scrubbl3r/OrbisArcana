# Rule Engine V1 Slice 210 Smoke

## Goal
- Fail fast when `signalWhereOverrides` numeric bounds are reversed.

## Checks
- Add a temporary invalid override:
  - `signalWhereOverrides: { "<signal_id>": { path: "ms", gte: 900, lte: 200 } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>] lower bound cannot be greater than upper bound`

## Cleanup
- Restore bounds so lower <= upper and confirm clean validation/startup.
