# Rule Engine V1 Slice 221 Smoke

Goal
- Fail fast on padded signal-id keys in `signalExecuteActionsOverrides`.

Checks
- Add a temporary invalid override key with whitespace:
  - `signalExecuteActionsOverrides: { " rota ": true }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalExecuteActionsOverrides key must not include leading/trailing whitespace:  rota `

Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
