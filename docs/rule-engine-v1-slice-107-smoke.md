RULE ENGINE V1 - SLICE 107 SMOKE CHECKLIST

Purpose
- Add event-level matched-rule caps via:
  - `execution.maxMatchesPerEvent`
  - `sourceEventMaxMatchesPerEventOverrides`

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Global event cap sanity
- Set:
  `execution.maxMatchesPerEvent: 1`
  `execution.maxMatchesPerSignal: 0`
- Restart and trigger a source event payload that can produce multiple rule matches.
- Confirm only one matched rule executes/emits.

3) Source-event override sanity
- Set:
  `execution.maxMatchesPerEvent: 0`
  `sourceEventMaxMatchesPerEventOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger multi-match payload on that source event.
- Confirm cap applies for that event stream.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
