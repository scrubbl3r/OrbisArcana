# Rule Engine V2 Slice 42 Smoke

## Goal
enforce integrity of the generated minimal authoring artifact.

## Added check
- `tools/rule-engine-v2/check-master-control-authoring-v2.mjs`
- Verifies:
  - schema id is correct
  - required top-level fields are valid types
  - `spells[]` ids are unique and active in spellbook
  - `rules` count matches interactions-v2 rules

## Wiring
- `ready:v2` now runs this check automatically.
- script alias: `npm run check:master-control-authoring:v2`

## Expected
- stale or malformed authoring artifacts fail pre-smoke.
