# Rule Engine V1 Slice 69 Smoke Checklist

## Purpose
- Make same-source signal ordering deterministic when priorities tie.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Tie-order sanity
- Configure two same-source signals with equal priority.
- Confirm evaluation order follows source definition order.

3) Priority sanity
- Raise one signal via `signalPriorityOverrides`.
- Confirm higher-priority signal evaluates first.

4) Stability sanity
- Restart a few times and confirm ordering remains stable.
