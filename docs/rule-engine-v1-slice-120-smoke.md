# RULE ENGINE V1 - SLICE 120 SMOKE CHECKLIST

## Purpose
- Add per-signal action-telemetry type gates via `signalActionExecutedEventTypeEnabledOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal wake telemetry off sanity
- Set:
  `execution.executeActions: true`
  `execution.emitActionExecutedEvents: true`
  `execution.actionExecutedEventTypeEnabled: { wake_win: true, event: true }`
  `sourceEventActionExecutedEventTypeEnabledOverrides: { "voice.spell_detected": { wake_win: true, event: true } }`
  `signalActionExecutedEventTypeEnabledOverrides: { "spell.rota": { wake_win: false, event: true } }`
- Restart and trigger `spell.rota` rules with both action types.
- Confirm only `event` telemetry emits.

3) Precedence sanity
- Keep signal map above and source-event map fully true.
- Confirm signal-level value wins.

4) Validation sanity
- Set unsupported keys/non-boolean values; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
