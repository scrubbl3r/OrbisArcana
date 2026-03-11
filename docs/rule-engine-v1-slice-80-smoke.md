# RULE ENGINE V1 - SLICE 80 SMOKE CHECKLIST

## Purpose
- Add per-rule action fanout caps via `ruleActionLimitOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.maxActionsPerRuleMatch: 0`
  `ruleActionLimitOverrides: { r_rota_yspin_charged: 1 }`
- Restart and trigger that rule; confirm only one action executes for that rule.

3) Precedence sanity
- Set `execution.maxActionsPerRuleMatch: 2` and keep `ruleActionLimitOverrides` at 1.
- Confirm the rule still executes at most one action.

4) Validation sanity
- Set negative/fractional limit and confirm fail-fast.
- Set unknown rule id and confirm fail-fast.
