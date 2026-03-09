# Rule Engine V1 Slice 215 Smoke

Goal
- Fail fast on padded signal-id keys in `signalWhereOverrides`.

Checks
- Add a temporary invalid override key with whitespace:
  - `signalWhereOverrides: { " rota ": { path: "ms", gte: 100 } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides key must not include leading/trailing whitespace:  rota `

Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
