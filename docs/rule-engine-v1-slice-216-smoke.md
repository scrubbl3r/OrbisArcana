# Rule Engine V1 Slice 216 Smoke

## Goal
- Fail fast on padded signal-id keys in `signalPriorityOverrides`.

## Checks
- Add a temporary invalid override key with whitespace:
  - `signalPriorityOverrides: { " rota ": 5 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalPriorityOverrides key must not include leading/trailing whitespace:  rota `

## Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
