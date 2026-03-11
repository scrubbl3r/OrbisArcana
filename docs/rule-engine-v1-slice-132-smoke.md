# Rule Engine V1 Slice 132 Smoke

## Goal
- Add optional summary payload detail flag via `execution.sourceEventSummaryIncludeSignalAndRuleIds`.

## Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `execution.sourceEventSummaryIncludeSignalAndRuleIds: true`
- Trigger a payload that matches at least one signal/rule.
- Confirm `rule_engine.v1.source_event_summary` includes `signalId` and `ruleId`.

Off Check
- Set `execution.sourceEventSummaryIncludeSignalAndRuleIds: false`.
- Confirm summary event omits `signalId` and `ruleId`.

Fail-Fast
- Set `execution.sourceEventSummaryIncludeSignalAndRuleIds: 1`; confirm validation fails (must be boolean).
