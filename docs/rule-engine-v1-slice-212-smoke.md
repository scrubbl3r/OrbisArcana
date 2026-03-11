# Rule Engine V1 Slice 212 Smoke

## Goal
- Fail fast when a `signalWhereOverrides` entry omits `path`.

## Checks
- Add a temporary invalid override:
  - `signalWhereOverrides: { "<signal_id>": { gte: 100 } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>].path is required`

## Cleanup
- Add a non-empty `path` string and confirm clean validation/startup.
