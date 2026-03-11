# Rule Engine V1 Slice 74 Smoke Checklist

## Purpose
- Add global source-event debounce via `execution.sourceEventDebounceMs`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default behavior sanity
- Keep `execution.sourceEventDebounceMs: 0` (default).
- Confirm current behavior is unchanged.

3) Source-event debounce sanity
- Set `execution.sourceEventDebounceMs: 200`.
- Restart and rapidly emit the same source event payload stream.
- Confirm repeated source-event payloads inside 200ms are ignored.

4) Independence sanity
- Keep per-signal debounce off and verify source-event debounce alone still throttles noisy streams.

5) Validation sanity
- Set negative/non-numeric value and confirm config fail-fast.
