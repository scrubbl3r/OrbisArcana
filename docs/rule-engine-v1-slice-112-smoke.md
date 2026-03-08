RULE ENGINE V1 - SLICE 112 SMOKE CHECKLIST

Purpose
- Add signal-level action caps per signal hit via:
  - `execution.maxActionsPerSignal`
  - `signalMaxActionsPerSignalOverrides`

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Global signal action cap sanity
- Set:
  `execution.maxActionsPerSignal: 1`
- Restart and trigger a signal/rule that would execute multiple actions.
- Confirm only one action executes for that signal hit.

3) Signal override sanity
- Set:
  `execution.maxActionsPerSignal: 0`
  `signalMaxActionsPerSignalOverrides: { "spell.rota": 1 }`
- Restart and trigger `spell.rota` with multi-action rule.
- Confirm only one action executes for that signal hit.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
