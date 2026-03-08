# Rule Engine V1 Slice 145 Smoke

Goal
- Fail fast on empty signal-id keys in `signalSourceEventOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalSourceEventOverrides: { "": "voice.spell_detected" }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalSourceEventOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
