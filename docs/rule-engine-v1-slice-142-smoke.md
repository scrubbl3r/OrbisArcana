# Rule Engine V1 Slice 142 Smoke

## Goal
- Fail fast on unknown nested keys inside `ruleTimingOverrides[ruleId]`.

## Checks
- Add a temporary unknown key under an existing rule override:
  - `ruleTimingOverrides: { "r_rota_yspin_charged": { cooldownMs: 250, bogusTiming: 1 } }`
- Run config validation/startup path.
- Confirm validation fails with:
  - `RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides[r_rota_yspin_charged] contains unknown key: bogusTiming`

## Cleanup
- Remove `bogusTiming` and confirm normal startup/validation is clean again.
