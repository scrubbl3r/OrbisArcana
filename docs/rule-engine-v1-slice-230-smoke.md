# Rule Engine V1 Slice 230 Smoke

## Goal
- Fail fast on padded nested `actionType` keys in `...ActionTypeEnabled...` maps.

Covered maps
- `ruleActionExecutedEventTypeEnabledOverrides`
- `ruleActionTypeEnabledOverrides`
- `signalActionTypeEnabledOverrides`
- `signalActionExecutedEventTypeEnabledOverrides`
- `sourceEventActionTypeEnabledOverrides`
- `sourceEventActionExecutedEventTypeEnabledOverrides`

## Checks
- In each covered map, set nested key with padding (for example `{ " event ": true }`).
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  event `

## Cleanup
- Remove nested key padding and confirm clean validation/startup.
