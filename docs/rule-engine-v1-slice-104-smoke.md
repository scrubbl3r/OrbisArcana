# RULE ENGINE V1 - SLICE 104 SMOKE CHECKLIST

## Purpose
- Add per-signal action fanout caps via `signalMaxActionsPerRuleMatchOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal action cap sanity
- Set:
  `execution.maxActionsPerRuleMatch: 0`
  `sourceEventMaxActionsPerRuleMatchOverrides: { "voice.spell_detected": 2 }`
  `signalMaxActionsPerRuleMatchOverrides: { "spell.rota": 1 }`
- Restart and trigger a `spell.rota` rule with multiple actions.
- Confirm only one action executes.

3) Precedence sanity
- Keep signal cap at `1`.
- Set `ruleActionLimitOverrides` for the matched rule to `2`.
- Confirm rule-level cap wins.

4) Validation sanity
- Set negative/fractional/non-numeric value in `signalMaxActionsPerRuleMatchOverrides`; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
