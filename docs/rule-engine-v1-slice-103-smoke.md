# Rule Engine V1 Slice 103 Smoke Checklist

## Purpose
- Add per-signal cooldown scaling via `signalCooldownScaleOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Signal cooldown scale sanity
- Set:
  `execution.cooldownScale: 1`
  `sourceEventCooldownScaleOverrides: { "voice.spell_detected": 1 }`
  `signalCooldownScaleOverrides: { "spell.rota": 2 }`
- Restart and trigger `spell.rota` repeatedly on a rule with non-zero cooldown.
- Confirm longer cooldown spacing for that signal.

3) Precedence sanity
- Keep signal override above.
- Set `ruleCooldownScaleOverrides` for the matched rule to `0.5`.
- Confirm rule-level value wins.

4) Validation sanity
- Set negative/non-numeric value in `signalCooldownScaleOverrides`; confirm fail-fast.
- Set unknown signal id; confirm fail-fast.
