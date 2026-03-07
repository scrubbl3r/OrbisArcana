RULE ENGINE V1 - SLICE 84 SMOKE CHECKLIST

Purpose
- Add per-source-event signal fanout caps via `sourceEventMaxSignalsOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.maxSignalsPerEvent: 0`
  `sourceEventMaxSignalsOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger payloads that can match multiple signals on that source event.
- Confirm only one matching signal is processed for that source event.

3) Precedence sanity
- Set `execution.maxSignalsPerEvent: 2` while override remains `1`.
- Confirm that source event still caps at one.

4) Validation sanity
- Set negative/fractional value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
