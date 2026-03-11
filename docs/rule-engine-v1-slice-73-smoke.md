# RULE ENGINE V1 - SLICE 73 SMOKE CHECKLIST

## Purpose
- Add centralized action fanout cap via `execution.maxActionsPerRuleMatch`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Unlimited default sanity
- Keep `execution.maxActionsPerRuleMatch: 0` (default).
- Trigger a rule with multiple actions; confirm all actions execute.

3) Action cap sanity
- Set `execution.maxActionsPerRuleMatch: 1`.
- Restart and trigger same rule; confirm only first executable action runs.

4) Mid cap sanity
- Set `execution.maxActionsPerRuleMatch: 2`.
- Confirm at most two actions execute for the matched rule.

5) Validation sanity
- Set negative or fractional value and confirm config fail-fast.
