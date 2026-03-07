RULE ENGINE V1 - SLICE 68 SMOKE CHECKLIST

Purpose
- Tighten override integrity: unknown rule IDs now fail fast in rule/action override maps.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Unknown rule fail-fast (priority)
- Set: `rulePriorityOverrides: { not_a_rule: 50 }`
- Confirm config validation fail-fast.

3) Unknown rule fail-fast (rule enabled)
- Set: `ruleEnabledOverrides: { not_a_rule: false }`
- Confirm config validation fail-fast.

4) Unknown rule fail-fast (action enabled)
- Set: `actionEnabledOverrides: { "not_a_rule.event.grace": false }`
- Confirm config validation fail-fast.

5) Valid overrides sanity
- Restore valid rule IDs and confirm clean startup.
