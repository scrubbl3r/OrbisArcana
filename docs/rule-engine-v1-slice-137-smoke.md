# Rule Engine V1 Slice 137 Smoke

Goal
- Add per-source-event summary budget-cap detail control via `sourceEventSummaryIncludeBudgetCapsOverrides`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeBudgetCaps: false`
  - `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.spell_detected": true }
- Trigger `voice.spell_detected` payload.
- Confirm summary includes budget-cap fields:
  - `maxSignalsEvaluatedPerEvent`
  - `maxSignalsPerEvent`
  - `maxRulesEvaluatedPerEvent`
  - `maxMatchesPerEvent`
  - `maxActionsPerEvent`

Inverse Check
- Set:
  - `execution.sourceEventSummaryIncludeBudgetCaps: true`
  - `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.spell_detected": false }
- Trigger `voice.spell_detected` payload.
- Confirm budget-cap fields are omitted.

Fail-Fast
- Set `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.spell_detected": 1 }`; confirm validation fails.
- Set `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.unknown": true }`; confirm validation fails unknown source event.
