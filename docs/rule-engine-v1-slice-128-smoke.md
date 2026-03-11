# Rule Engine V1 Slice 128 Smoke

## Goal
- Add source-event summary telemetry emission toggle via `execution.emitSourceEventSummaryEvents`.

## Checks
- Set `execution.emitSourceEventSummaryEvents: true`.
- Trigger a known source-event payload (for example `voice.spell_detected`).
- Confirm one `rule_engine.v1.source_event_summary` event is emitted per handled payload.
- Confirm payload includes:
  - `sourceEvent`
  - `atMs`
  - `evaluatedSignalCount`
  - `matchedSignalCount`
  - `evaluatedRuleCount`
  - `matchedRuleCount`
  - `actionCount`

Off Check
- Set `execution.emitSourceEventSummaryEvents: false`.
- Confirm no `rule_engine.v1.source_event_summary` emission.

Fail-Fast
- Set `execution.emitSourceEventSummaryEvents: 1`; confirm validation fails (must be boolean).
