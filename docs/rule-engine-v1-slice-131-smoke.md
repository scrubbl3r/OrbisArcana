# Rule Engine V1 Slice 131 Smoke

Goal
- Add rule-level source-event summary telemetry control via `ruleEmitSourceEventSummaryOverrides`.

Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: false`
  - `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": false }`
  - `signalEmitSourceEventSummaryOverrides: { "spell.rota": false }`
  - `ruleEmitSourceEventSummaryOverrides: { "r1": true }`
- Trigger payload that matches rule `r1`.
- Confirm `rule_engine.v1.source_event_summary` emits.

Inverse Check
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": true }`
  - `signalEmitSourceEventSummaryOverrides: { "spell.rota": true }`
  - `ruleEmitSourceEventSummaryOverrides: { "r1": false }`
- Trigger payload that matches `r1`.
- Confirm summary event does not emit.

Fail-Fast
- Set `ruleEmitSourceEventSummaryOverrides: { "r1": 1 }`; confirm validation fails.
- Set `ruleEmitSourceEventSummaryOverrides: { "r_unknown": true }`; confirm validation fails unknown rule id.
