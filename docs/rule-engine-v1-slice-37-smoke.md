# Rule Engine V1 Slice 37 Smoke Checklist

## Purpose
- Remove runtime bootstrap dependence on legacy rule config alias and use only `RULE_ENGINE_V1_MASTER_CONFIG` as the active contract.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Master-config path sanity
- Confirm schema hydration/validation runs from `RULE_ENGINE_V1_MASTER_CONFIG`.

3) Behavior sanity
- Trigger known rule flow and confirm behavior unchanged.

4) Diagnostics sanity
- Confirm config validation errors (if intentionally triggered) reference `RULE_ENGINE_V1_MASTER_CONFIG` naming.
