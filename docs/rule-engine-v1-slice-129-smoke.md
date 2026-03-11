# Rule Engine V1 Slice 129 Smoke

## Goal
- Add per-source-event summary telemetry control via `sourceEventEmitSourceEventSummaryOverrides`.

## Checks
- Set:
  - `execution.emitSourceEventSummaryEvents: false`
  - `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": true }`
- Trigger `voice.spell_detected` payload.
- Confirm `rule_engine.v1.source_event_summary` still emits for that source event.

Inverse Check
- Set:
  - `execution.emitSourceEventSummaryEvents: true`
  - `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": false }`
- Trigger `voice.spell_detected` payload.
- Confirm summary event does not emit for that source event.

Fail-Fast
- Set `sourceEventEmitSourceEventSummaryOverrides: { "voice.spell_detected": 1 }`; confirm validation fails.
- Set `sourceEventEmitSourceEventSummaryOverrides: { "voice.unknown": true }`; confirm validation fails unknown source event.
