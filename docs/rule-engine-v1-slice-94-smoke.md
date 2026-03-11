# RULE ENGINE V1 - SLICE 94 SMOKE CHECKLIST

## Purpose
- Add per-source-event cooldown scaling via `sourceEventCooldownScaleOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source event scale sanity
- Set:
  `execution.cooldownScale: 1`
  `sourceEventCooldownScaleOverrides: { "voice.spell_detected": 0.5 }`
- Restart and trigger matching rules from that source event.
- Confirm cooldown behavior is faster for that source stream.

3) Precedence sanity
- Add `ruleCooldownScaleOverrides` for a specific rule and confirm rule-level value wins over source-event scale.

4) Validation sanity
- Set negative/non-numeric value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
