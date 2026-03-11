# Rule Engine V1 Slice 61 Smoke Checklist

## Purpose
- Add global match-window scaling via `execution.matchWindowScale` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default behavior sanity
- Keep `execution.matchWindowScale: 1` (default).
- Confirm multi-signal timing behavior remains unchanged.

3) Tighten window sanity
- Set `execution.matchWindowScale: 0.5`.
- Restart and confirm timing-sensitive chains require tighter timing.

4) Loosen window sanity
- Set `execution.matchWindowScale: 2`.
- Restart and confirm timing-sensitive chains tolerate wider spacing.

5) Validation sanity
- Set `execution.matchWindowScale` to a negative or non-numeric value and confirm config fail-fast.
