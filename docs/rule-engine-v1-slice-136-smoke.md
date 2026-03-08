# Rule Engine V1 Slice 136 Smoke

Goal
- Add optional budget-cap fields in source-event summaries via `execution.sourceEventSummaryIncludeBudgetCaps`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeBudgetCaps: true`
- Trigger a source-event payload.
- Confirm `rule_engine.v1.source_event_summary` includes:
  - `maxSignalsEvaluatedPerEvent`
  - `maxSignalsPerEvent`
  - `maxRulesEvaluatedPerEvent`
  - `maxMatchesPerEvent`
  - `maxActionsPerEvent`

Off Check
- Set `execution.sourceEventSummaryIncludeBudgetCaps: false`.
- Confirm those budget-cap fields are omitted.

Fail-Fast
- Set `execution.sourceEventSummaryIncludeBudgetCaps: 1`; confirm validation fails (must be boolean).
