# Rule Engine V1 Slice 05 Smoke Checklist

## Purpose
- Add second executable rule action path: `event: electric_aoe`.
- Keep execution behind existing feature flag.

Flag
- `RULE_ENGINE_V1_EXECUTE_ACTIONS` in `game-receiver.js` (default `false`).

## Quick Smoke (Manual)
1) Default-off
- Boot with flag `false`.
- Confirm normal behavior unchanged.

2) Enable and probe
- Set flag to `true`.
- Trigger a matching rule path.
- Expect rule engine to emit action execution and electric AOE effect to fire through existing cast-action executor.

3) Grace regression
- With flag `true`, ensure `event: grace` still grants float grace.

4) Reset safety
- Set flag back to `false`.
- Confirm rule actions stop executing.
