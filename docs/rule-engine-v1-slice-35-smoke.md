# RULE ENGINE V1 - SLICE 35 SMOKE CHECKLIST

## Purpose
- Make spell schema integrity validation consume rule/event/binding data from the master config path (not split modules).

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Integrity validation sanity
- Confirm startup integrity validation passes with current config.

3) Failure probe
- Temporarily remove an event runtime binding referenced by a configured rule event.
- Restart and confirm fail-fast integrity error.
- Revert and confirm recovery.

4) Behavior sanity
- Trigger known rule path and confirm behavior unchanged.
