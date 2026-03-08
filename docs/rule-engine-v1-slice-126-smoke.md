# Rule Engine V1 Slice 126 Smoke

Goal
- Add per-signal matched-signal cap for one source-event payload via `signalMaxSignalsPerEventOverrides`.

Checks
- Set:
  - `execution.maxSignalsPerEvent: 0`
  - `sourceEventMaxSignalsOverrides: { "voice.spell_detected": 0 }`
  - `signalMaxSignalsPerEventOverrides: { "spell.rota": 1 }`
- Trigger a payload where `spell.rota` and another signal can both match.
- Confirm processing stops after the `spell.rota` signal hit in that payload.

Precedence Check
- Set:
  - `execution.maxSignalsPerEvent: 3`
  - `sourceEventMaxSignalsOverrides: { "voice.spell_detected": 2 }`
  - `signalMaxSignalsPerEventOverrides: { "spell.rota": 1 }`
- Confirm effective matched-signal cap is 1 when `spell.rota` is hit.

Fail-Fast
- Set `signalMaxSignalsPerEventOverrides: { "spell.rota": -1 }`; confirm validation fails.
- Set `signalMaxSignalsPerEventOverrides: { "spell.unknown": 1 }`; confirm validation fails unknown signal id.
