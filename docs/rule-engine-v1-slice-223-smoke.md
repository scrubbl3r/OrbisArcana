# Rule Engine V1 Slice 223 Smoke

Goal
- Fail fast on padded signal-id keys in `signalMatchWindowScaleOverrides`.

Checks
- Add a temporary invalid override key with whitespace:
  - `signalMatchWindowScaleOverrides: { " rota ": 1.2 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalMatchWindowScaleOverrides key must not include leading/trailing whitespace:  rota `

Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
