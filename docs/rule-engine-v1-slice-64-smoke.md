RULE ENGINE V1 - SLICE 64 SMOKE CHECKLIST

Purpose
- Add per-signal ordering control via `signalPriorityOverrides` in master control.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Priority override sanity
- In `rule-engine-v1-master-control.js`, set:
  `signalPriorityOverrides: { "gesture.y_spin": 50 }`
- Restart and confirm y-spin signal is evaluated ahead of same-source lower-priority signals.

3) Tie/order sanity
- Remove override (or set same priority values) and confirm behavior falls back to source definition order.

4) Validation sanity
- Set non-numeric priority value and confirm config fail-fast.
- Set unknown signal id in `signalPriorityOverrides` and confirm config fail-fast.
