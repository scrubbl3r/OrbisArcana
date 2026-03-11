# Rule Engine v2 Slice 25 Smoke

## Goal
derive `RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS` directly from `interactions-v2` rules instead of maintaining a separate manual list.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Startup should remain normal.
2. Verify immediate paths still work:
   - `domus` (with `orbis` gate flow)
   - `pyro`
   - `electrum`
   - `fridgis`

## Expected
- No behavior change.
- Reduced duplication: immediate ownership now follows `interactions-v2` SSOT.
