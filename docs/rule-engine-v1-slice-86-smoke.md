# RULE ENGINE V1 - SLICE 86 SMOKE CHECKLIST

## Purpose
- Add per-source-event first-match control via `sourceEventStopOnFirstSignalMatchOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.stopOnFirstSignalMatchPerEvent: false`
  `sourceEventStopOnFirstSignalMatchOverrides: { "voice.spell_detected": true }`
- Restart and trigger payloads that can match multiple signals on `voice.spell_detected`.
- Confirm only the first matching signal is processed for that source event.

3) Precedence sanity
- Flip global to true and set that source event override to false.
- Confirm source event processes multiple matching signals again.

4) Validation sanity
- Set non-boolean value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
