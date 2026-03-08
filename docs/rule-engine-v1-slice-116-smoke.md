RULE ENGINE V1 - SLICE 116 SMOKE CHECKLIST

Purpose
- Add per-signal action telemetry overrides via `signalEmitActionExecutedOverrides`.

Quick Smoke (manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal action telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `sourceEventEmitActionExecutedOverrides: { "voice.spell_detected": true }`
  `signalEmitActionExecutedOverrides: { "spell.rota": false }`
- Restart and trigger `spell.rota` actions.
- Confirm actions still execute but no `rule_engine.v1.action_executed` telemetry emits for that signal.

3) Precedence sanity
- Keep signal override `false` and set source-event override `true`.
- Confirm signal-level value wins.

4) Validation sanity
- Set non-boolean values; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
