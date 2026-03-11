# RULE ENGINE V1 - SLICE 78 SMOKE CHECKLIST

## Purpose
- Add central signal source remapping via `signalSourceEventOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source remap sanity
- Set, for example:
  `signalSourceEventOverrides: { "spell.rota": "voice.spell_recognized" }`
- Restart and confirm that signal now responds to the remapped event stream.

3) Revert sanity
- Remove override and confirm behavior returns to default source event.

4) Validation sanity
- Set non-string/empty source event value and confirm fail-fast.
- Set unknown signal id in `signalSourceEventOverrides` and confirm fail-fast.
