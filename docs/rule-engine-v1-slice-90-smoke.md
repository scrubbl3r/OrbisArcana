RULE ENGINE V1 - SLICE 90 SMOKE CHECKLIST

Purpose
- Add global action-type execution gates via `execution.actionTypeEnabled`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Disable events sanity
- Set:
  `execution.actionTypeEnabled: { event: false, wake_win: true }`
- Restart and trigger a rule with both action types.
- Confirm event actions do not execute while wake window actions still do.

3) Disable wake windows sanity
- Set:
  `execution.actionTypeEnabled: { event: true, wake_win: false }`
- Confirm wake window actions are suppressed while events still execute.

4) Validation sanity
- Set unsupported key or non-boolean value and confirm fail-fast.
