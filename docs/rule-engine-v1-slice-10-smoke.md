# Rule Engine V1 Slice 10 Smoke Checklist

## Purpose
- Make KWS panel semantics data-driven for wake/school/class token groups.
- Remove remaining token-name hardcoding from panel logic.

## Quick Smoke (Manual)
1) Wake tokens
- Toggle wake spell activity in spellbook/routing inputs.
- Confirm KWS panel wake behavior follows configured `wakeTokens`/`wakeRequiredTokens`.

2) School axis expectations
- Open flat-spin windows on each axis.
- Confirm expected school highlighting follows `axisSchoolByAxis` config.

3) Class window
- Confirm class token heard/lighting behavior follows configured `classTokens`.

4) Config source check
- Verify `kws-config` emits:
  - `wakeTokens`
  - `wakeRequiredTokens`
  - `schoolTokens`
  - `classTokens`
  - `axisSchoolByAxis`
- Verify panel receives these through `game-receiver` constants wiring.
