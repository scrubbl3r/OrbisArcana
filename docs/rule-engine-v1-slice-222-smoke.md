# Rule Engine V1 Slice 222 Smoke

## Goal
- Fail fast on padded signal-id keys in `signalActionTypeEnabledOverrides`.

## Checks
- Add a temporary invalid override key with whitespace:
  - `signalActionTypeEnabledOverrides: { " rota ": { event: true } }`
- Run config validation/startup path.
- Confirm validation includes:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalActionTypeEnabledOverrides key must not include leading/trailing whitespace:  rota `

## Cleanup
- Remove whitespace from the key and confirm clean validation/startup.
