# Rule Engine V2 Slice 16 Smoke

Goal: stage `pyro` immediate behavior into `INTERACTIONS_V2` without changing live behavior yet.

## What was added

1. New V2 rule: `r_pyro_immediate`
   - `on: spell.pyro`
   - `then: event.flame_aoe`
2. New event definition + runtime binding:
   - `flame_aoe` -> cast action `aoe_flame`
3. Signal coverage for rule-engine-owned immediate spells from `voice.spell_detected`.

## Expected right now

- No user-facing behavior change while `RULE_ENGINE_V1_EXECUTE_ACTIONS` remains `false`.
- Validation + projection health should stay green.

## Smoke

1. Run `npm run smoke:milestone:v2`.
2. Confirm pass and rule count increased as expected.
