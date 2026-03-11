# Rule Engine V1 Slice 109 Smoke Checklist

## Purpose
- Add per-signal event-action caps via `signalMaxActionsPerEventOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal event-action cap sanity
- Set:
  `execution.maxActionsPerEvent: 0`
  `sourceEventMaxActionsPerEventOverrides: { "voice.spell_detected": 3 }`
  `signalMaxActionsPerEventOverrides: { "spell.rota": 1 }`
- Restart and trigger a payload where `spell.rota` can execute multiple actions.
- Confirm only one action executes for that signal within the payload.

3) Precedence sanity
- Keep source-event cap at `3` and signal cap at `1`.
- Confirm signal cap wins.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
