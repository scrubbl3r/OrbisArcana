RULE ENGINE V1 - SLICE 101 SMOKE CHECKLIST

Purpose
- Add per-signal action-type gating via `signalActionTypeEnabledOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal action-type gate sanity
- Set:
  `execution.actionTypeEnabled: { wake_win: true, event: true }`
  `sourceEventActionTypeEnabledOverrides: { "voice.spell_detected": { wake_win: true, event: true } }`
  `signalActionTypeEnabledOverrides: { "spell.rota": { wake_win: false, event: true } }`
- Restart and trigger `spell.rota` on a rule containing both `wake_win` and `event` actions.
- Confirm only `event` actions execute for that signal.

3) Precedence sanity
- Keep the signal map above.
- Set `ruleActionTypeEnabledOverrides` for one matched rule to `{ wake_win: true, event: true }`.
- Confirm rule-level override wins for that rule.

4) Validation sanity
- Set unsupported key in signal action-type map; confirm fail-fast.
- Set non-boolean gate value; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
