# RULE ENGINE V1 - SLICE 55 SMOKE CHECKLIST

## Purpose
- Add centralized execution policy via `execution.stopOnFirstMatch` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default behavior sanity
- Leave `execution.stopOnFirstMatch: false` (default) in `rule-engine-v1-master-control.js`.
- Trigger a signal that can satisfy multiple candidate rules; confirm all matching rules may fire.

3) Stop-on-first sanity
- Set `execution.stopOnFirstMatch: true`.
- Restart and trigger the same signal path; confirm only the first matched rule fires.

4) Validation sanity
- Set `execution` to a non-object or set `stopOnFirstMatch` to a non-boolean; confirm config validation fail-fast.
