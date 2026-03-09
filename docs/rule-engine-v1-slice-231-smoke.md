# Rule Engine V1 Slice 231 Smoke

Goal
- Fail fast on empty nested `actionType` keys in `...ActionTypeEnabled...` maps.

Covered maps
- `ruleActionExecutedEventTypeEnabledOverrides`
- `ruleActionTypeEnabledOverrides`
- `signalActionTypeEnabledOverrides`
- `signalActionExecutedEventTypeEnabledOverrides`
- `sourceEventActionTypeEnabledOverrides`
- `sourceEventActionExecutedEventTypeEnabledOverrides`

Checks
- In each covered map, add an empty nested key (for example `{ "": true }`).
- Run config validation/startup path.
- Confirm each emits:
  - `... contains empty action type key`

Cleanup
- Remove empty nested keys and confirm clean validation/startup.
