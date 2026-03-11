# Rule Engine v2 Slice 19 Smoke

## Goal
stage `electrum` immediate cast into `INTERACTIONS_V2.rules` with v1 static fallback parity.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Start receiver and phone; verify normal startup.
2. Speak `electrum`; confirm behavior unchanged.
3. Re-check `orbis + domus` and `pyro` baseline paths.

## Expected
- No startup regressions.
- Rule projection drift remains zero.
