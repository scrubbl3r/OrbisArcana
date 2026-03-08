RULE ENGINE V1 - SLICE 97 SMOKE CHECKLIST

Purpose
- Add per-source-event rule-match flow controls:
  - `sourceEventStopOnFirstMatchOverrides`
  - `sourceEventMaxMatchesPerSignalOverrides`

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source-event stop-on-first rule sanity
- Set:
  `execution.stopOnFirstMatch: false`
  `sourceEventStopOnFirstMatchOverrides: { "voice.spell_detected": true }`
- Restart and trigger a signal that can match multiple rules.
- Confirm only the first matched rule executes.

3) Source-event max-matches sanity
- Set:
  `execution.maxMatchesPerSignal: 0`
  `sourceEventStopOnFirstMatchOverrides: { "voice.spell_detected": false }`
  `sourceEventMaxMatchesPerSignalOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger a signal that can match multiple rules.
- Confirm only one rule match executes.

4) Precedence sanity
- Add `signalMaxMatchesOverrides` for the same signal with value `2`.
- Confirm signal-level override wins over source-event max-matches.

5) Validation sanity
- Set non-boolean value in `sourceEventStopOnFirstMatchOverrides`; confirm fail-fast.
- Set negative/fractional value in `sourceEventMaxMatchesPerSignalOverrides`; confirm fail-fast.
- Set unknown source-event key in either map; confirm fail-fast.
