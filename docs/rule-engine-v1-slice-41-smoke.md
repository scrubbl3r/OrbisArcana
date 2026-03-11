# Rule Engine V1 Slice 41 Smoke Checklist

## Purpose
- Make `validateRuleEngineV1Config()` default to `RULE_ENGINE_V1_MASTER_CONTROL` and align diagnostics to master-control naming.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Validator default-path sanity
- Confirm config validation works when called without explicit config injection.

3) Naming sanity
- Trigger an intentional config validation error.
- Confirm error text references `RULE_ENGINE_V1_MASTER_CONTROL` keys.

4) Behavior sanity
- Trigger known rule path and confirm behavior unchanged.
