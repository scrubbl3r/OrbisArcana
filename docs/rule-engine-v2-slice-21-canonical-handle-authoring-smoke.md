# Rule Engine v2 Slice 21 Smoke

## Goal
author `interactions-v2` rules using canonical ALLCAPS entity handles (signals/events) instead of raw string literals.

## Validate
1. Run `npm run ready:v2`.
2. Run `npm run smoke:milestone:v2`.

## Human smoke
1. Start receiver + phone; confirm clean startup.
2. Trigger:
   - `orbis + domus`
   - `pyro`
   - `electrum`
   - `fridgis`
   - `rota` chain

## Expected
- No behavior change.
- Rule projection drift remains zero.
- Authoring readability improved around canonical handles.
