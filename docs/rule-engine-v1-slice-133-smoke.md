# Rule Engine V1 Slice 133 Smoke

Goal
- Add per-source-event summary detail control via `sourceEventSummaryIncludeSignalAndRuleIdsOverrides`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: false`
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": true }
- Trigger `voice.spell_detected` payload.
- Confirm summary includes `signalId` and `ruleId`.

Inverse Check
- Set:
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: true`
  - `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": false }
- Trigger `voice.spell_detected` payload.
- Confirm summary omits `signalId` and `ruleId`.

Fail-Fast
- Set `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.spell_detected": 1 }`; confirm validation fails.
- Set `sourceEventSummaryIncludeSignalAndRuleIdsOverrides: { "voice.unknown": true }`; confirm validation fails unknown source event.
