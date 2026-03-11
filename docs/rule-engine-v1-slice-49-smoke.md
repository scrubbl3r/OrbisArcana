# RULE ENGINE V1 - SLICE 49 SMOKE CHECKLIST

## Purpose
- Add centralized per-rule toggles via top-level `ruleEnabledOverrides` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Central disable sanity
- In `rule-engine-v1-master-control.js`, set:
  `ruleEnabledOverrides: { r_rota_yspin_charged: false }`
- Restart and confirm that rule no longer matches/fires.

3) Re-enable sanity
- Flip override to `true` (or remove key).
- Restart and confirm rule behavior returns.

4) Validation sanity
- Set an override value to non-boolean and confirm config validation fail-fast.
