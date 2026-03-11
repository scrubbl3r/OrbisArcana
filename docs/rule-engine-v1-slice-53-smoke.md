# Rule Engine V1 Slice 53 Smoke Checklist

## Purpose
- Add centralized per-rule priority tuning via `rulePriorityOverrides` in master control.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Central priority override sanity
- In `rule-engine-v1-master-control.js`, set:
  `rulePriorityOverrides: { r_rota_yspin_charged: 80 }`
- Restart and confirm the rule reports/behaves with elevated priority when competing matches occur.

3) Precedence sanity
- If a rule also has explicit `priority`, confirm `rulePriorityOverrides` wins.

4) Validation sanity
- Set non-numeric priority override and confirm config validation fail-fast.
