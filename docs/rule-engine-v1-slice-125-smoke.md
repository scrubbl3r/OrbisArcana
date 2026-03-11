# Rule Engine V1 Slice 125 Smoke

## Goal
- Add per-signal event-loop short-circuit control via `signalStopOnFirstSignalMatchPerEventOverrides`.

## Checks
- Set:
  - `execution.stopOnFirstSignalMatchPerEvent: false`
  - `sourceEventStopOnFirstSignalMatchOverrides: { "voice.spell_detected": false }`
  - `signalStopOnFirstSignalMatchPerEventOverrides: { "spell.rota": true }`
- Trigger a `voice.spell_detected` payload where both `spell.rota` and another signal would match.
- Confirm processing stops immediately after `spell.rota` signal hit for that payload.

Precedence Check
- Set:
  - `execution.stopOnFirstSignalMatchPerEvent: true`
  - `sourceEventStopOnFirstSignalMatchOverrides: { "voice.spell_detected": false }`
  - `signalStopOnFirstSignalMatchPerEventOverrides: { "spell.rota": false }`
- Confirm `spell.rota` does not force stop in that source-event because signal override wins.

Fail-Fast
- Set `signalStopOnFirstSignalMatchPerEventOverrides: { "spell.rota": 1 }`; confirm validation fails (must be boolean).
- Set `signalStopOnFirstSignalMatchPerEventOverrides: { "spell.unknown": true }`; confirm validation fails unknown signal id.
