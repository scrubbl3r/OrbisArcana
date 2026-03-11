# Rule Engine V1 Slice 56 Smoke Checklist

## Purpose
- Add centralized execution cap via `execution.maxMatchesPerSignal` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Unlimited default sanity
- Keep `execution.maxMatchesPerSignal: 0` (default).
- Trigger a path where multiple rules can match the same signal; confirm all matched rules may fire.

3) Match-cap sanity
- Set `execution.maxMatchesPerSignal: 1`.
- Restart and trigger same path; confirm only one matched rule fires for that signal hit.

4) Combined policy sanity
- Set `execution.stopOnFirstMatch: false` and `execution.maxMatchesPerSignal: 2`.
- Confirm at most two matched rules fire per signal hit.

5) Validation sanity
- Set `execution.maxMatchesPerSignal` to `-1` or `1.5`; confirm config validation fail-fast.
