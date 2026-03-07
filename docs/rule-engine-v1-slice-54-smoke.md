RULE ENGINE V1 - SLICE 54 SMOKE CHECKLIST

Purpose
- Add centralized per-rule timing tuning via `ruleTimingOverrides` in master control.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Central timing override sanity
- In `rule-engine-v1-master-control.js`, set:
  `ruleTimingOverrides: { r_rota_yspin_charged: { cooldownMs: 120, matchWindowMs: 2600 } }`
- Restart and confirm rule uses overridden timing.

3) Precedence sanity
- If rule also has explicit timing fields, confirm `ruleTimingOverrides` wins.

4) Validation sanity
- Set invalid timing values or unknown rule id in `ruleTimingOverrides` and confirm config fail-fast.
