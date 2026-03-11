# Rule Engine V1 Slice 89 Smoke Checklist

## Purpose
- Add per-rule action execution control via `ruleExecuteActionsOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule dry-run sanity
- Set:
  `execution.executeActions: true`
  `ruleExecuteActionsOverrides: { r_rota_yspin_charged: false }`
- Restart and trigger that rule; confirm it still matches but does not execute actions.

3) Precedence sanity
- Set global `execution.executeActions: false` and set that rule override to `true`.
- Confirm rule action execution remains disabled (global off still wins).

4) Validation sanity
- Set non-boolean value and confirm fail-fast.
- Set unknown rule id and confirm fail-fast.
