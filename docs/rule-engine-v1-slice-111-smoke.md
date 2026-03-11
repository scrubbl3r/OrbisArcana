# RULE ENGINE V1 - SLICE 111 SMOKE CHECKLIST

## Purpose
- Add per-signal event-match caps via `signalMaxMatchesPerEventOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal event-match cap sanity
- Set:
  `execution.maxMatchesPerEvent: 0`
  `sourceEventMaxMatchesPerEventOverrides: { "voice.spell_detected": 3 }`
  `signalMaxMatchesPerEventOverrides: { "spell.rota": 1 }`
- Restart and trigger a payload where `spell.rota` can match multiple rules.
- Confirm only one rule match is emitted/executed for that signal within the payload.

3) Precedence sanity
- Keep source-event cap at `3` and signal cap at `1`.
- Confirm signal cap wins.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
