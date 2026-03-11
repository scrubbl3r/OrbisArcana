# Rule Engine V1 Slice 57 Smoke Checklist

## Purpose
- Add centralized signal toggles via `signalEnabledOverrides` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal disable sanity
- In `rule-engine-v1-master-control.js`, set:
  `signalEnabledOverrides: { "gesture.y_spin": false }`
- Restart and confirm y-spin-driven rule chains no longer trigger.

3) Signal re-enable sanity
- Set same override back to `true` (or remove it).
- Restart and confirm those chains trigger again.

4) Validation sanity
- Set non-boolean override value and confirm config fail-fast.
- Set unknown signal id in `signalEnabledOverrides` and confirm config fail-fast.
