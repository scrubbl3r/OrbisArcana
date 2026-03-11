# Rule Engine V1 Slice 01 Smoke Checklist

## Purpose
- Establish baseline behavior while introducing data-only rule schema scaffolding.
- Expected gameplay impact for this slice: none.

## Quick Smoke (Manual)
1) Wake + cast baseline
- Speak `orbis`, then `domus`.
- Expect wake behavior unchanged and `domus` cast path still works.

2) Flat-spin load window baseline
- Open flat-spin window, select school token, then class token.
- Expect spell load to still occur; no behavior change from previous build.

3) Shake detonation baseline
- Trigger shake on a loaded slot.
- Expect spell cast + slot consume behavior unchanged.

4) Inactive spell guard baseline
- Set one spell `active: false` in `src/voice/spellbook.js`.
- Expect that token not to match/cast and reject reason remains valid.

## Data Schema Files Added (Not Yet Runtime-Wired)
- `src/content/spell-rules/signal-definitions-v1.js`
- `src/content/spell-rules/window-definitions-v1.js`
- `src/content/spell-rules/event-definitions-v1.js` (`ms` only by design)
- `src/content/spell-rules/spell-rules-v1.js`
- `src/content/spell-rules/validate-spell-rules-v1.js`

## Notes
- Event definitions intentionally only include `ms` defaults for now.
- Additional event params can be added later using this same pattern.
