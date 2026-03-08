# Rule Engine V1 Slice 138 Smoke

Goal
- Add per-signal summary budget-cap detail control via `signalSummaryIncludeBudgetCapsOverrides`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeBudgetCaps: false`
  - `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.spell_detected": false }`
  - `signalSummaryIncludeBudgetCapsOverrides: { "spell.rota": true }`
- Trigger a `voice.spell_detected` payload that matches signal `spell.rota`.
- Confirm summary includes budget-cap fields:
  - `maxSignalsEvaluatedPerEvent`
  - `maxSignalsPerEvent`
  - `maxRulesEvaluatedPerEvent`
  - `maxMatchesPerEvent`
  - `maxActionsPerEvent`

Inverse Check
- Set:
  - `execution.sourceEventSummaryIncludeBudgetCaps: true`
  - `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.spell_detected": true }`
  - `signalSummaryIncludeBudgetCapsOverrides: { "spell.rota": false }`
- Trigger the same matching payload.
- Confirm budget-cap fields are omitted.

Fail-Fast
- Set `signalSummaryIncludeBudgetCapsOverrides: { "spell.rota": 1 }`; confirm validation fails.
- Set `signalSummaryIncludeBudgetCapsOverrides: { "spell.unknown": true }`; confirm validation fails unknown signal id.
