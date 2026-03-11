# Rule Engine V1 Slice 208 Smoke

## Goal
- Fail fast when a `signalWhereOverrides` entry has no comparator.

## Checks
- Add a temporary invalid override:
  - `signalWhereOverrides: { "<signal_id>": { path: "ms" } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>] must include at least one comparator (eq|gt|gte|lt|lte)`

## Cleanup
- Add a comparator (for example `gte`) or remove the override entry, then confirm clean validation/startup.
