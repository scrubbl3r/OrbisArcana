# Rule Engine V1 Slice 113 Smoke Checklist

## Purpose
- Add per-source-event signal action caps via `sourceEventMaxActionsPerSignalOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source-event signal action cap sanity
- Set:
  `execution.maxActionsPerSignal: 0`
  `sourceEventMaxActionsPerSignalOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger a signal/rule from that source event that would execute multiple actions.
- Confirm only one action executes for that signal hit.

3) Precedence sanity
- Keep source-event cap at `1`.
- Set `signalMaxActionsPerSignalOverrides: { "spell.rota": 2 }`.
- Confirm signal-level cap wins for that signal.

4) Validation sanity
- Set negative/fractional/non-numeric values; confirm fail-fast.
- Set unknown source-event key; confirm fail-fast.
