# Rule Engine V1 Slice 141 Smoke

## Goal
- Fail fast on unknown keys inside `ruleDefaults`.

## Checks
- Add a temporary unknown key:
  - `ruleDefaults: { ..., bogusDefault: 1 }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleDefaults contains unknown key: bogusDefault`

## Cleanup
- Remove `bogusDefault` and confirm normal startup/validation is clean again.
