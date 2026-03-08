# Rule Engine V1 Slice 207 Smoke

Goal
- Fail fast when `signalWhereOverrides[*].path` is not a string.

Checks
- Add a temporary invalid override:
  - `signalWhereOverrides: { "<signal_id>": { path: 123, gte: 100 } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>].path must be a string when present`

Cleanup
- Restore `path` to a string and confirm clean validation/startup.
