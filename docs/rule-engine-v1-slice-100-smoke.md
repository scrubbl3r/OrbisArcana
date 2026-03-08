RULE ENGINE V1 - SLICE 100 SMOKE CHECKLIST

Purpose
- Add per-signal action execution control via `signalExecuteActionsOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal action disable sanity
- Set:
  `execution.executeActions: true`
  `sourceEventExecuteActionsOverrides: { "voice.spell_detected": true }`
  `signalExecuteActionsOverrides: { "spell.rota": false }`
- Restart and trigger `spell.rota` on a rule that normally performs actions.
- Confirm matched-rule telemetry can still occur, but no actions execute.

3) Precedence sanity
- Keep `signalExecuteActionsOverrides["spell.rota"] = false`.
- Set `ruleExecuteActionsOverrides` for one matched rule to `true`.
- Confirm rule-level override wins and actions execute for that rule.

4) Validation sanity
- Set non-boolean value in `signalExecuteActionsOverrides`; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
