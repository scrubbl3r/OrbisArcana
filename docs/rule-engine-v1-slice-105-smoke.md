# Rule Engine V1 Slice 105 Smoke Checklist

## Purpose
- Add candidate evaluation caps via:
  - `execution.maxRulesEvaluatedPerSignal`
  - `signalMaxRulesEvaluatedOverrides`

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Global evaluation cap sanity
- Set:
  `execution.maxRulesEvaluatedPerSignal: 1`
  `execution.maxMatchesPerSignal: 0`
- Restart and trigger a signal with multiple candidate rules.
- Confirm only first candidate rule is evaluated/matched.

3) Signal override sanity
- Set:
  `execution.maxRulesEvaluatedPerSignal: 0`
  `signalMaxRulesEvaluatedOverrides: { "spell.rota": 1 }`
- Restart and trigger `spell.rota` with multiple candidate rules.
- Confirm only first candidate rule is evaluated for that signal.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown signal id in signal override map; confirm fail-fast.
