# Rule Engine V1 Slice 224 Smoke (Batch)

Goal
- Fail fast on padded source-event keys across 10 `sourceEvent*Overrides` maps.

Covered maps
- `sourceEventEnabledOverrides`
- `sourceEventDebounceOverrides`
- `sourceEventMaxSignalsOverrides`
- `sourceEventMaxSignalsEvaluatedPerEventOverrides`
- `sourceEventMaxActionsPerSignalOverrides`
- `sourceEventMaxRulesEvaluatedOverrides`
- `sourceEventMaxRulesEvaluatedPerEventOverrides`
- `sourceEventMaxMatchesPerEventOverrides`
- `sourceEventMaxActionsPerEventOverrides`
- `sourceEventStopOnFirstSignalMatchOverrides`

Checks
- In each covered map, add one temporary key with leading/trailing spaces (for example `" voice.partial.stable "`).
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  <key> `

Cleanup
- Remove key padding and confirm clean validation/startup.
