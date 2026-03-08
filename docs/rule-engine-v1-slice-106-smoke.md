RULE ENGINE V1 - SLICE 106 SMOKE CHECKLIST

Purpose
- Add per-source-event candidate-evaluation cap via `sourceEventMaxRulesEvaluatedOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source-event evaluation cap sanity
- Set:
  `execution.maxRulesEvaluatedPerSignal: 0`
  `sourceEventMaxRulesEvaluatedOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger a signal from that source event with multiple candidate rules.
- Confirm only first candidate rule is evaluated.

3) Precedence sanity
- Keep source-event cap at `1`.
- Set `signalMaxRulesEvaluatedOverrides: { "spell.rota": 2 }`.
- Confirm signal-level cap wins for that signal.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
