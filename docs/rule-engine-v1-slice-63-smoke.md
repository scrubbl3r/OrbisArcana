RULE ENGINE V1 - SLICE 63 SMOKE CHECKLIST

Purpose
- Add per-signal debounce tuning via `signalDebounceOverrides` in master control.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity (specific noisy signal)
- Keep global `execution.signalDebounceMs: 0`.
- Set `signalDebounceOverrides: { "gesture.y_spin": 250 }`.
- Restart and rapidly repeat y-spin; confirm duplicates inside 250ms are ignored.

3) Fallback sanity
- Remove the y-spin override and set global `execution.signalDebounceMs: 250`.
- Restart and confirm debounce now applies via global fallback.

4) Validation sanity
- Set a negative/non-numeric debounce value in `signalDebounceOverrides` and confirm fail-fast.
- Set unknown signal id in `signalDebounceOverrides` and confirm fail-fast.
