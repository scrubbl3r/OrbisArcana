# RULE ENGINE V1 - SLICE 11 SMOKE CHECKLIST

## Purpose
- Centralize rule `event` execution through runtime binding config.
- Remove special-case handling branches for individual event ids.

## Quick Smoke (Manual)
1) Flag off baseline
- Keep `RULE_ENGINE_V1_EXECUTE_ACTIONS = false`.
- Confirm no behavior change.

2) Flag on event execution
- Set `RULE_ENGINE_V1_EXECUTE_ACTIONS = true`.
- Trigger rule path that executes:
  - `event: grace` -> should grant float grace via `orb.float_grace_grant` binding.
  - `event: electric_aoe` -> should execute cast action `aoe_electric`.

3) Binding edit probe
- In `event-runtime-bindings-v1.js`, temporarily change `electric_aoe` castActionId.
- Confirm runtime follows new mapping after restart.
- Revert after test.

4) Wake window regression
- Ensure `wake_win` action path still opens wake gate as before.
