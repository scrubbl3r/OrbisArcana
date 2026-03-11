# Rule Engine V1 Slice 72 Smoke Checklist

## Purpose
- Add centralized source-event gating via `sourceEventEnabledOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source-event disable sanity
- Set:
  `sourceEventEnabledOverrides: { "voice.spell_detected": false }`
- Restart and confirm rule-engine chains driven by that source event stop firing.

3) Re-enable sanity
- Set the same key to `true` (or remove it).
- Restart and confirm those chains resume.

4) Validation sanity
- Set non-boolean override value and confirm config fail-fast.
- Set unknown source event key and confirm config fail-fast.
