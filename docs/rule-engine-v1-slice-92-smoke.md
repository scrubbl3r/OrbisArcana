RULE ENGINE V1 - SLICE 92 SMOKE CHECKLIST

Purpose
- Add per-rule action-type gates via `ruleActionTypeEnabledOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule action-type gate sanity
- Set:
  `ruleActionTypeEnabledOverrides: { r_rota_yspin_charged: { event: false } }`
- Restart and trigger that rule.
- Confirm event actions are suppressed for that rule while wake window actions still execute.

3) Precedence sanity
- Set source/global event gate false, then set that rule override `event:true`.
- Confirm that rule still emits event actions.

4) Validation sanity
- Set unsupported key/non-boolean values and confirm fail-fast.
- Set unknown rule id and confirm fail-fast.
