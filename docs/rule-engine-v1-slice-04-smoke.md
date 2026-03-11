# Rule Engine V1 Slice 04 Smoke Checklist

## Purpose
- Add first executable action path (`type: "event", id: "grace"`) behind a feature flag.
- Default remains non-executing.

Current flag
- `RULE_ENGINE_V1_EXECUTE_ACTIONS = false` in `game-receiver.js`.

## Quick Smoke (Manual)
1) Default-off safety
- Boot receiver with default flag (`false`).
- Confirm gameplay behavior unchanged.

2) Preview path still works
- Trigger signals used by `SPELL_RULES_V1`.
- Confirm no new gameplay side effects while preview matching continues.

3) Optional execution probe
- Temporarily set `RULE_ENGINE_V1_EXECUTE_ACTIONS = true`.
- Trigger a matching rule path.
- Expect `orb.float_grace_grant` to be emitted via rule action execution for `event: grace`.
- Set flag back to `false` after test.

## Notes
- Action execution in this slice only supports `event/grace`.
- Other actions remain non-executing and are intentionally ignored.
