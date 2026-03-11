# RULE ENGINE V1 - SLICE 96 SMOKE CHECKLIST

## Purpose
- Add per-source-event action fanout caps via `sourceEventMaxActionsPerRuleMatchOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source event cap sanity
- Set:
  `execution.maxActionsPerRuleMatch: 0`
  `sourceEventMaxActionsPerRuleMatchOverrides: { "voice.spell_detected": 1 }`
- Restart and trigger a rule from that source event with multiple actions.
- Confirm only one action executes.

3) Precedence sanity
- Set global cap `2` and keep source-event cap `1`.
- Confirm source-event cap still applies.
- Add `ruleActionLimitOverrides` for the same rule at `2` and confirm rule-level cap wins.

4) Validation sanity
- Set negative/fractional value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
