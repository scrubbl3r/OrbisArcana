# Rule Engine V1 Slice 211 Smoke

Goal
- Fail fast when `signalWhereOverrides[*].eq` is explicitly undefined.

Checks
- Add a temporary invalid override:
  - `signalWhereOverrides: { "<signal_id>": { path: "orb.state", eq: undefined } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[<signal_id>].eq must not be undefined`

Cleanup
- Set `eq` to a concrete value (or remove it) and confirm clean validation/startup.
