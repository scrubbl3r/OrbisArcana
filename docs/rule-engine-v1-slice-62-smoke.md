# Rule Engine V1 Slice 62 Smoke Checklist

## Purpose
- Add global signal debounce via `execution.signalDebounceMs` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default behavior sanity
- Keep `execution.signalDebounceMs: 0` (default).
- Confirm current trigger responsiveness is unchanged.

3) Debounce sanity
- Set `execution.signalDebounceMs: 250`.
- Restart and rapidly repeat a trigger source that emits the same signal id.
- Confirm rapid duplicates inside 250ms are ignored.

4) Debounce off sanity
- Set value back to `0`.
- Confirm rapid repeats are accepted again.

5) Validation sanity
- Set `execution.signalDebounceMs` to a negative or non-numeric value and confirm config fail-fast.
