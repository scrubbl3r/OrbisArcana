# Rule Engine V1 Slice 66 Smoke Checklist

## Purpose
- Add centralized per-action arg patching via `actionArgOverrides` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Event arg override sanity
- Set:
  `actionArgOverrides: { "r_rota_yspin_charged.event.grace": { ms: 900 } }`
- Restart and trigger that rule; confirm grace event runs with `ms=900`.

3) Window arg override sanity
- Set:
  `actionArgOverrides: { "r_rota_yspin_charged.wake_win.0": { ttlMs: 1500 } }`
- Restart and confirm wake window action uses overridden ttl.

4) Validation sanity
- Set non-object override value and confirm config fail-fast.
- Set unknown rule key prefix in `actionArgOverrides` and confirm config fail-fast.
