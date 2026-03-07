RULE ENGINE V1 - SLICE 65 SMOKE CHECKLIST

Purpose
- Add `execution.stopOnFirstSignalMatchPerEvent` to process only one signal per source event payload.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Multi-signal default sanity
- Keep `execution.stopOnFirstSignalMatchPerEvent: false`.
- Trigger a source event payload that can match multiple signals; confirm all matching signals are processed.

3) First-signal-only sanity
- Set `execution.stopOnFirstSignalMatchPerEvent: true`.
- Restart and trigger the same payload; confirm only the first matching signal is processed.

4) Ordering sanity
- Combine with `signalPriorityOverrides` to choose which matching signal wins first.

5) Validation sanity
- Set non-boolean value and confirm config fail-fast.
