RULE ENGINE V1 - SLICE 122 SMOKE CHECKLIST

Purpose
- Add event-level candidate-evaluation caps via:
  - `execution.maxRulesEvaluatedPerEvent`
  - `sourceEventMaxRulesEvaluatedPerEventOverrides`

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Global per-event evaluation cap sanity
- Set:
  `execution.maxRulesEvaluatedPerEvent: 1`
  `execution.maxMatchesPerSignal: 0`
- Restart and trigger a payload where one signal has multiple candidate rules.
- Confirm only one candidate rule is evaluated for that payload.

3) Source-event override sanity
- Set:
  `execution.maxRulesEvaluatedPerEvent: 0`
  `sourceEventMaxRulesEvaluatedPerEventOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger same payload.
- Confirm cap applies for that source event.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
