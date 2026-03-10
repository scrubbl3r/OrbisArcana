# Rule Engine V2 Slice 17 Smoke

Goal: stage `fridgis` + `electrum` immediate casts into `INTERACTIONS_V2.rules` via event ids, while preserving compatibility.

## Setup
- Keep `RULE_ENGINE_V1_EXECUTE_ACTIONS=false` for this slice.

## Validate
1. Run `npm run ready:v2`.
2. Confirm no drift or integrity failures.

## Human smoke
1. Start receiver and phone as usual.
2. Verify KWS online and wake words light as expected.
3. Speak `fridgis` and `electrum`; confirm current behavior is unchanged for this staged slice.
4. Confirm `orbis + domus` still teleports as before.

## Expected
- No runtime regressions.
- Rules snapshot includes `r_fridgis_immediate` and `r_electrum_immediate`.
