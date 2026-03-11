# Rule Engine V1 Slice 99 Smoke Checklist

## Purpose
- Add per-signal preview telemetry control via `signalEmitPreviewMatchedOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal telemetry off sanity
- Set:
  `execution.emitPreviewMatchedEvents: true`
  `sourceEventEmitPreviewMatchedOverrides: { "voice.spell_detected": true }`
  `signalEmitPreviewMatchedOverrides: { "spell.rota": false }`
- Restart and trigger `spell.rota`.
- Confirm no `rule_engine.v1.preview_matched` telemetry for that signal.

3) Precedence sanity
- Keep signal override `false` and set `ruleEmitPreviewMatchedOverrides` for one matched rule to `true`.
- Confirm rule-level override wins and emits telemetry for that rule.

4) Validation sanity
- Set non-boolean value in `signalEmitPreviewMatchedOverrides`; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
