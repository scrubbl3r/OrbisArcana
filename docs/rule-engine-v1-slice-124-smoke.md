# Rule Engine V1 Slice 124 Smoke

## Goal
- Add candidate-signal evaluation cap per source-event payload.

New Controls
- `execution.maxSignalsEvaluatedPerEvent`
- `sourceEventMaxSignalsEvaluatedPerEventOverrides`

## Checks
- Set:
  - `execution.maxSignalsEvaluatedPerEvent: 1`
  - `sourceEventMaxSignalsEvaluatedPerEventOverrides: { "voice.spell_detected": 0 }`
- Create a payload where multiple signals on `voice.spell_detected` could match.
- Confirm only the first signal candidate is evaluated for that payload.

Precedence Check
- Set:
  - `execution.maxSignalsEvaluatedPerEvent: 3`
  - `sourceEventMaxSignalsEvaluatedPerEventOverrides: { "voice.spell_detected": 1 }`
- Confirm effective cap is 1 for `voice.spell_detected` payloads.

Fail-Fast
- Set `execution.maxSignalsEvaluatedPerEvent: -1`; confirm validation fails.
- Set `sourceEventMaxSignalsEvaluatedPerEventOverrides: { "voice.spell_detected": -1 }`; confirm validation fails.
- Set `sourceEventMaxSignalsEvaluatedPerEventOverrides: { "voice.unknown": 1 }`; confirm validation fails unknown source event.
