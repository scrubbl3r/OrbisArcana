# Rule Engine V2 Slice 20 Smoke

Goal: stage `fridgis` immediate cast into `INTERACTIONS_V2.rules` with parity fallback.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Start receiver and phone; confirm normal startup.
2. Speak `fridgis`; confirm behavior unchanged.
3. Re-check baseline:
   - `electrum`
   - `pyro`
   - `orbis + domus`

## Expected
- No startup regressions.
- Rule projection drift remains zero.
