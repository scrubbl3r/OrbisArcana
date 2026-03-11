# Rule Engine V1 Slice 226 Smoke (Batch)

## Goal
- Fail fast on padded keys across 10 override maps (sourceEvent/rule/action/event/window).

Covered maps
- `sourceEventMaxActionsPerRuleMatchOverrides`
- `sourceEventStopOnFirstMatchOverrides`
- `sourceEventMaxMatchesPerSignalOverrides`
- `ruleEnabledOverrides`
- `actionEnabledOverrides`
- `actionArgOverrides`
- `eventEnabledOverrides`
- `eventDefaultOverrides`
- `windowEnabledOverrides`
- `windowDefaultOverrides`

## Checks
- In each covered map, add one temporary key with leading/trailing spaces.
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  <key> `

## Cleanup
- Remove key padding and confirm clean validation/startup.
