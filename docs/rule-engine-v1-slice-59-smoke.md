# Rule Engine V1 Slice 59 Smoke Checklist

## Purpose
- Add centralized window toggles via `windowEnabledOverrides` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Window disable sanity
- In `rule-engine-v1-master-control.js`, set:
  `windowEnabledOverrides: { wake_win: false }`
- Restart and trigger a wake-window-producing chain; confirm wake window action does not execute.

3) Window re-enable sanity
- Set same override back to `true` (or remove it).
- Restart and confirm wake window behavior returns.

4) Validation sanity
- Set non-boolean override value and confirm config fail-fast.
- Set unknown window id in `windowEnabledOverrides` and confirm config fail-fast.
