# Rule Engine V1 Slice 218 Smoke

Goal
- Fail fast on padded signal-id keys in `signalMaxMatchesOverrides`.

Checks
- Add a temporary invalid override key with whitespace:
  - `signalMaxMatchesOverrides: { " rota ": 2 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalMaxMatchesOverrides key must not include leading/trailing whitespace:  rota `

Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
