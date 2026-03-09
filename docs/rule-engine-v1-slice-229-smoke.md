# Rule Engine V1 Slice 229 Smoke (Batch, Pattern Close)

Goal
- Finish whitespace-key fail-fast coverage for the final 10 groups.

Covered groups
- `signalEmitSourceEventSummaryOverrides`
- `signalSummaryIncludeSignalAndRuleIdsOverrides`
- `signalSummaryIncludeBudgetCapsOverrides`
- `signalActionExecutedEventTypeEnabledOverrides`
- `signalMaxMatchesPerEventOverrides`
- `signalMaxSignalsPerEventOverrides`
- `signalMaxSignalsEvaluatedPerEventOverrides`
- `signalMaxRulesEvaluatedPerEventOverrides`
- `signalStopOnFirstSignalMatchPerEventOverrides`
- `eventRuntimeBindings`

Checks
- Add one temporary key with leading/trailing spaces in each covered map.
- Run config validation/startup path.
- Confirm each emits:
  - `... key must not include leading/trailing whitespace:  <key> `

Cleanup
- Remove key padding and confirm clean validation/startup.
