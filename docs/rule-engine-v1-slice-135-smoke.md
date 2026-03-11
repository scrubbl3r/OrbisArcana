# Rule Engine V1 Slice 135 Smoke

## Goal
- Add rule-level summary detail control via `ruleSummaryIncludeSignalAndRuleIdsOverrides`.

## Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: false`
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": false }
  - `signalSummaryIncludeSignalAndRuleIdsOverrides: { "spell.rota": false }
  - `ruleSummaryIncludeSignalAndRuleIdsOverrides: { "r1": true }
- Trigger payload matching rule `r1`.
- Confirm summary includes `signalId` and `ruleId`.

Inverse Check
- Set:
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: true`
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": true }
  - `signalSummaryIncludeSignalAndRuleIdsOverrides: { "spell.rota": true }
  - `ruleSummaryIncludeSignalAndRuleIdsOverrides: { "r1": false }
- Trigger payload matching `r1`.
- Confirm summary omits `signalId` and `ruleId`.

Fail-Fast
- Set `ruleSummaryIncludeSignalAndRuleIdsOverrides: { "r1": 1 }`; confirm validation fails.
- Set `ruleSummaryIncludeSignalAndRuleIdsOverrides: { "r_unknown": true }`; confirm validation fails unknown rule id.
