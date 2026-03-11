# Rule Engine V1 Slice 130 Smoke

## Goal
- Add per-signal source-event summary telemetry control via `signalEmitSourceEventSummaryOverrides`.

## Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: false`
  - `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": false }`
  - `signalEmitSourceEventSummaryOverrides: { "spell.rota": true }`
- Trigger `voice.spell_detected` payload that matches `spell.rota`.
- Confirm `rule_engine.v1.source_event_summary` emits.

Inverse Check
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": true }`
  - `signalEmitSourceEventSummaryOverrides: { "spell.rota": false }`
- Trigger `voice.spell_detected` payload that matches `spell.rota`.
- Confirm summary event does not emit.

Fail-Fast
- Set `signalEmitSourceEventSummaryOverrides: { "spell.rota": 1 }`; confirm validation fails.
- Set `signalEmitSourceEventSummaryOverrides: { "spell.unknown": true }`; confirm validation fails unknown signal id.
