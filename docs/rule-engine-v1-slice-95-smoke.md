# Rule Engine V1 Slice 95 Smoke Checklist

## Purpose
- Add per-source-event match-window scaling via `sourceEventMatchWindowScaleOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Source event scale sanity
- Set:
  `execution.matchWindowScale: 1`
  `sourceEventMatchWindowScaleOverrides: { "voice.spell_detected": 0.5 }`
- Restart and trigger timing-sensitive chains from that source event.
- Confirm tighter timing on that source stream.

3) Precedence sanity
- Add `ruleMatchWindowScaleOverrides` for a specific rule and confirm rule-level value wins over source-event scale.

4) Validation sanity
- Set negative/non-numeric value and confirm fail-fast.
- Set unknown source event and confirm fail-fast.
