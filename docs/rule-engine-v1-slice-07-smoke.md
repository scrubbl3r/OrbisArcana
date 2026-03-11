# Rule Engine V1 Slice 07 Smoke Checklist

## Purpose
- Add executable `wake_win` action support (feature-flagged with existing Rule Engine execute flag).

Flag
- `RULE_ENGINE_V1_EXECUTE_ACTIONS` in `game-receiver.js` (default `false`).

## Quick Smoke (Manual)
1) Default-off
- Boot with flag `false`.
- Confirm no behavior change.

2) Flag-on wake window probe
- Set flag to `true`.
- Trigger a rule that includes a `wake_win` action.
- Expect:
  - voice mode set to `wake_token_open_world`
  - `rule_engine.v1.wake_win_opened` emitted
  - KWS wake HUD gate opens for `ttlMs` from wake_win defaults/overrides.

3) Regression check
- With flag `true`, ensure existing rule `event` actions (`grace`, `electric_aoe`) still execute.

4) Reset
- Set flag back to `false` and confirm actions stop executing.
