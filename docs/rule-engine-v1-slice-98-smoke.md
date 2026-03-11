# RULE ENGINE V1 - SLICE 98 SMOKE CHECKLIST

## Purpose
- Add per-signal rule-match short-circuit via `signalStopOnFirstMatchOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal-level stop-on-first sanity
- Set:
  `execution.stopOnFirstMatch: false`
  `sourceEventStopOnFirstMatchOverrides: { "voice.spell_detected": false }`
  `signalStopOnFirstMatchOverrides: { "spell.rota": true }`
- Restart and trigger `spell.rota` where multiple rules can match.
- Confirm only the first matched rule executes for that signal.

3) Precedence sanity
- Keep `signalStopOnFirstMatchOverrides["spell.rota"] = true`.
- Set `sourceEventStopOnFirstMatchOverrides["voice.spell_detected"] = false`.
- Confirm signal-level value still wins.

4) Validation sanity
- Set non-boolean value in `signalStopOnFirstMatchOverrides`; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
