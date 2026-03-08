# Rule Engine V1 Slice 139 Smoke

Goal
- Add per-rule summary budget-cap detail control via `ruleSummaryIncludeBudgetCapsOverrides`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeBudgetCaps: false`
  - `sourceEventSummaryIncludeBudgetCapsOverrides: { "voice.spell_detected": false }`
  - `signalSummaryIncludeBudgetCapsOverrides: { "spell.rota": false }`
  - `ruleSummaryIncludeBudgetCapsOverrides: { "r_rota_yspin_charged": true }`
- Trigger a `voice.spell_detected` payload that matches `spell.rota` and rule `r_rota_yspin_charged`.
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
  - `signalSummaryIncludeBudgetCapsOverrides: { "spell.rota": true }`
  - `ruleSummaryIncludeBudgetCapsOverrides: { "r_rota_yspin_charged": false }`
- Trigger the same matching payload.
- Confirm budget-cap fields are omitted.

Fail-Fast
- Set `ruleSummaryIncludeBudgetCapsOverrides: { "r_rota_yspin_charged": 1 }`; confirm validation fails.
- Set `ruleSummaryIncludeBudgetCapsOverrides: { "r_unknown": true }`; confirm validation fails unknown rule id.
