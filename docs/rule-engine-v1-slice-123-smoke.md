# Rule Engine V1 Slice 123 Smoke

## Goal
- Add per-signal event-level candidate evaluation cap via `signalMaxRulesEvaluatedPerEventOverrides`.

## Checks
- Set:
  - `execution.maxRulesEvaluatedPerEvent: 0`
  - `sourceEventMaxRulesEvaluatedPerEventOverrides: { "voice.spell_detected": 0 }`
  - `signalMaxRulesEvaluatedPerEventOverrides: { "spell.rota": 1 }`
- Trigger a payload where `spell.rota` would evaluate multiple candidate rules.
- Confirm only one candidate is evaluated for `spell.rota` during that source-event payload.

Precedence Check
- Set:
  - `execution.maxRulesEvaluatedPerEvent: 3`
  - `sourceEventMaxRulesEvaluatedPerEventOverrides: { "voice.spell_detected": 2 }`
  - `signalMaxRulesEvaluatedPerEventOverrides: { "spell.rota": 1 }`
- Confirm effective cap is 1 for `spell.rota` in `voice.spell_detected` payloads.

Fail-Fast
- Set `signalMaxRulesEvaluatedPerEventOverrides: { "spell.rota": -1 }`; confirm validation fails.
- Set `signalMaxRulesEvaluatedPerEventOverrides: { "spell.unknown": 1 }`; confirm validation fails unknown signal id.
