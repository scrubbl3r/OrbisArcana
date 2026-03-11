# Rule Engine V1 Slice 117 Smoke Checklist

## Purpose
- Add rule-level action telemetry overrides via `ruleEmitActionExecutedOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule action telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `sourceEventEmitActionExecutedOverrides: { "voice.spell_detected": true }`
  `signalEmitActionExecutedOverrides: { "spell.rota": true }`
  `ruleEmitActionExecutedOverrides: { "r1": false }`
- Restart and trigger rule `r1` actions.
- Confirm actions still execute but no `rule_engine.v1.action_executed` telemetry emits for that rule.

3) Precedence sanity
- Keep rule override `false` while signal/source/global are `true`.
- Confirm rule-level value wins.

4) Validation sanity
- Set non-boolean values; confirm fail-fast.
- Set unknown rule id; confirm fail-fast.
