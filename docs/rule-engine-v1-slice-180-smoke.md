# Rule Engine V1 Slice 180 Smoke

Goal
- Fail fast on empty signal-id keys in `signalMaxRulesEvaluatedPerEventOverrides`.

Checks
- Add a temporary empty-key entry:
  - `signalMaxRulesEvaluatedPerEventOverrides: { "": 1 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.signalMaxRulesEvaluatedPerEventOverrides contains empty signal id key`

Cleanup
- Remove the empty-key entry and confirm normal startup/validation is clean again.
