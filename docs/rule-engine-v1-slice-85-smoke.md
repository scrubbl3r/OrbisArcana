# Rule Engine V1 Slice 85 Smoke Checklist

## Purpose
- Add per-signal rule-match caps via `signalMaxMatchesOverrides`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Override sanity
- Set:
  `execution.maxMatchesPerSignal: 0`
  `signalMaxMatchesOverrides: { "spell.rota": 1 }`
- Restart and trigger conditions where multiple rules can match `spell.rota`.
- Confirm only one rule match is processed for that signal.

3) Precedence sanity
- Set `execution.maxMatchesPerSignal: 2` while signal override remains `1`.
- Confirm signal still caps at one matched rule.

4) Validation sanity
- Set negative/fractional value and confirm fail-fast.
- Set unknown signal id and confirm fail-fast.
