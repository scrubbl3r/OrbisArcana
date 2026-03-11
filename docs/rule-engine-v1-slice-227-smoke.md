# Rule Engine V1 Slice 227 Smoke (Batch)

## Goal
- Fail fast on padded rule-id keys across 10 `rule*Overrides` maps.

Covered maps
- `rulePriorityOverrides`
- `ruleTimingOverrides`
- `ruleActionLimitOverrides`
- `ruleCooldownScaleOverrides`
- `ruleMatchWindowScaleOverrides`
- `ruleEmitPreviewMatchedOverrides`
- `ruleEmitActionExecutedOverrides`
- `ruleEmitSourceEventSummaryOverrides`
- `ruleSummaryIncludeSignalAndRuleIdsOverrides`
- `ruleSummaryIncludeBudgetCapsOverrides`

## Checks
- In each covered map, add one temporary key with leading/trailing spaces.
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  <key> `

## Cleanup
- Remove key padding and confirm clean validation/startup.
