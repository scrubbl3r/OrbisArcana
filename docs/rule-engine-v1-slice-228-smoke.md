# Rule Engine V1 Slice 228 Smoke (Batch)

## Goal
- Fail fast on padded keys across 10 remaining rule/signal override maps.

Covered maps
- `ruleActionExecutedEventTypeEnabledOverrides`
- `ruleExecuteActionsOverrides`
- `ruleActionTypeEnabledOverrides`
- `signalEnabledOverrides`
- `signalCooldownScaleOverrides`
- `signalMaxActionsPerRuleMatchOverrides`
- `signalMaxRulesEvaluatedOverrides`
- `signalMaxActionsPerEventOverrides`
- `signalMaxActionsPerSignalOverrides`
- `signalEmitActionExecutedOverrides`

## Checks
- In each covered map, add one temporary key with leading/trailing spaces.
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  <key> `

## Cleanup
- Remove key padding and confirm clean validation/startup.
