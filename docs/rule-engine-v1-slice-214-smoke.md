# Rule Engine V1 Slice 214 Smoke

## Goal
- Fail fast on padded signal-id keys in `signalSourceEventOverrides`.

## Checks
- Add a temporary invalid override key with whitespace:
  - `signalSourceEventOverrides: { " rota ": "voice.partial.stable" }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalSourceEventOverrides key must not include leading/trailing whitespace:  rota `

## Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
