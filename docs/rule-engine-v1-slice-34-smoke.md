# Rule Engine V1 Slice 34 Smoke Checklist

## Purpose
- Remove split rule-schema bootstrap contract usage; bootstrap now consumes only `RULE_ENGINE_V1_CONFIG` + `validateRuleEngineV1Config`.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm clean startup.

2) Rule schema hydration sanity
- Confirm runtime still receives signals/windows/events/rules/bindings via `setRuleSchemaV1` path.

3) Rule behavior sanity
- Trigger a known rule and confirm preview/match/action behavior unchanged.

4) Contract sanity
- Confirm no runtime dependency remains on bootstrap-exported split schema keys.
