# Rule Engine V1 Slice 217 Smoke

## Goal
- Fail fast on padded signal-id keys in `signalDebounceOverrides`.

## Checks
- Add a temporary invalid override key with whitespace:
  - `signalDebounceOverrides: { " rota ": 50 }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalDebounceOverrides key must not include leading/trailing whitespace:  rota `

## Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
