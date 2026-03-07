RULE ENGINE V1 - SLICE 70 SMOKE CHECKLIST

Purpose
- Add centralized signal fanout cap via `execution.maxSignalsPerEvent`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Unlimited default sanity
- Keep `execution.maxSignalsPerEvent: 0` (default).
- Trigger payloads that can match multiple signals; confirm all matching signals are processed.

3) Fanout cap sanity
- Set `execution.maxSignalsPerEvent: 1`.
- Restart and trigger same payload; confirm only one matching signal is processed.

4) Combined policy sanity
- Set `execution.stopOnFirstSignalMatchPerEvent: false` and `execution.maxSignalsPerEvent: 2`.
- Confirm at most two matching signals process per source-event payload.

5) Validation sanity
- Set negative or fractional value and confirm config fail-fast.
