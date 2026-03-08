# Rule Engine V1 Slice 134 Smoke

Goal
- Add per-signal summary detail control via `signalSummaryIncludeSignalAndRuleIdsOverrides`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: false`
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": false }
  - `signalSummaryIncludeSignalAndRuleIdsOverrides: { "spell.rota": true }
- Trigger payload matching `spell.rota`.
- Confirm summary includes `signalId` and `ruleId`.

Inverse Check
- Set:
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: true`
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": true }
  - `signalSummaryIncludeSignalAndRuleIdsOverrides: { "spell.rota": false }
- Trigger payload matching `spell.rota`.
- Confirm summary omits `signalId` and `ruleId`.

Fail-Fast
- Set `signalSummaryIncludeSignalAndRuleIdsOverrides: { "spell.rota": 1 }`; confirm validation fails.
- Set `signalSummaryIncludeSignalAndRuleIdsOverrides: { "spell.unknown": true }`; confirm validation fails unknown signal id.
