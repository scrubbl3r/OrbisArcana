# Rule Engine V1 Slice 127 Smoke

## Goal
- Add per-signal evaluated-signal cap for one source-event payload via `signalMaxSignalsEvaluatedPerEventOverrides`.

## Checks
- Set:
  - `execution.maxSignalsEvaluatedPerEvent: 0`
  - `sourceEventMaxSignalsEvaluatedPerEventOverrides: { "voice.spell_detected": 0 }`
  - `signalMaxSignalsEvaluatedPerEventOverrides: { "spell.rota": 1 }`
- Trigger a payload where multiple same-source signals are candidates.
- Confirm no more than one signal candidate is evaluated when the current signal is `spell.rota`.

Precedence Check
- Set:
  - `execution.maxSignalsEvaluatedPerEvent: 3`
  - `sourceEventMaxSignalsEvaluatedPerEventOverrides: { "voice.spell_detected": 2 }`
  - `signalMaxSignalsEvaluatedPerEventOverrides: { "spell.rota": 1 }`
- Confirm effective cap is 1 for `spell.rota` on `voice.spell_detected` payloads.

Fail-Fast
- Set `signalMaxSignalsEvaluatedPerEventOverrides: { "spell.rota": -1 }`; confirm validation fails.
- Set `signalMaxSignalsEvaluatedPerEventOverrides: { "spell.unknown": 1 }`; confirm validation fails unknown signal id.
