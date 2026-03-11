# Rule Engine V1 Slice 225 Smoke (Batch)

## Goal
- Fail fast on padded source-event keys across the next 10 `sourceEvent*Overrides` maps.

Covered maps
- `sourceEventEmitPreviewMatchedOverrides`
- `sourceEventEmitActionExecutedOverrides`
- `sourceEventActionTypeEnabledOverrides`
- `sourceEventEmitSourceEventSummaryOverrides`
- `sourceEventSummaryIncludeSignalAndRuleIdsOverrides`
- `sourceEventSummaryIncludeBudgetCapsOverrides`
- `sourceEventActionExecutedEventTypeEnabledOverrides`
- `sourceEventExecuteActionsOverrides`
- `sourceEventCooldownScaleOverrides`
- `sourceEventMatchWindowScaleOverrides`

## Checks
- In each covered map, add one temporary key with leading/trailing spaces.
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  <key> `

## Cleanup
- Remove key padding and confirm clean validation/startup.
