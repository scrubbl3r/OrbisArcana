RULE ENGINE V1 - SLICE 71 SMOKE CHECKLIST

Purpose
- Add global default rule priority via `ruleDefaults.priority`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Default priority sanity
- Set `ruleDefaults: { priority: 10 }`.
- Confirm rules without explicit `priority` inherit 10.

3) Per-rule precedence sanity
- Add explicit `priority` on one rule and confirm it overrides `ruleDefaults.priority`.

4) Central override precedence sanity
- Set `rulePriorityOverrides` for that same rule and confirm `rulePriorityOverrides` wins.

5) Validation sanity
- Set non-numeric `ruleDefaults.priority` and confirm config fail-fast.
