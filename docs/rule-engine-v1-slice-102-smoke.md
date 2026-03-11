# RULE ENGINE V1 - SLICE 102 SMOKE CHECKLIST

## Purpose
- Add per-signal match-window scaling via `signalMatchWindowScaleOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal match-window scale sanity
- Set:
  `execution.matchWindowScale: 1`
  `sourceEventMatchWindowScaleOverrides: { "voice.spell_detected": 1 }`
  `signalMatchWindowScaleOverrides: { "spell.rota": 0.5 }`
- Restart and trigger timing-sensitive chains containing `spell.rota`.
- Confirm tighter matching for that signal.

3) Precedence sanity
- Keep signal override above.
- Set `ruleMatchWindowScaleOverrides` for a matched rule to `1.5`.
- Confirm rule-level value wins.

4) Validation sanity
- Set negative/non-numeric value in `signalMatchWindowScaleOverrides`; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
