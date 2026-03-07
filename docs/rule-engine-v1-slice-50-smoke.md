RULE ENGINE V1 - SLICE 50 SMOKE CHECKLIST

Purpose
- Add centralized per-action toggles via top-level `actionEnabledOverrides` in master control.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Central action disable sanity
- In `rule-engine-v1-master-control.js`, set:
  `actionEnabledOverrides: { "r_rota_yspin_charged.event.orb_state": false }`
- Restart and trigger the rule.
- Confirm all other actions run except `orb_state` action.

3) Re-enable sanity
- Flip override to `true` (or remove key).
- Restart and confirm that action runs again.

4) Validation sanity
- Set an action override value to non-boolean and confirm config validation fail-fast.
