# Word Naming Refactor Completion Report

## Summary
The `spell*` -> `word*` refactor is complete across active runtime and tooling surfaces.
Canonical naming is now `word*` for authoring, runtime indexing, routing, and internal checks.

`npm run ready:v2` and `npm run status:v2` are green after final teardown.

## Removed Legacy Alias Surfaces

### Runtime routing/content exports removed
- `SPELL_RUNTIME_ROUTING`
- `SPELL_RUNTIME_ROUTING_TABLE`
- `SPELL_RUNTIME_ROUTING_BY_WORD_ID`
- `RUNTIME_SPELLS`
- `RUNTIME_SPELLS_BY_ID`
- `getRuntimeSpellById`

### VFX exports removed
- `SPELL_VFX_BINDINGS`
- `SPELL_VFX_BINDINGS_BY_SPELL_ID`
- `getSpellVfxBinding`

### Bootstrap context aliases removed
- `setRuntimeSpellIndexes`
- `initSpellActionHandlers`

## Remaining Intentional Compatibility Surface

### Event payload compatibility alias
- Runtime payloads may still include `spellId` as an alias of canonical `wordId`.
- This is intentional wire-compat for downstream consumers that have not fully migrated.

## Human Smoke Checklist (Post-Refactor)
1. Boot receiver and confirm no startup validation errors.
2. Verify immediate word trigger:
   - `domus` -> teleport behavior.
3. Verify wake-window chain:
   - axis select word (for example `pyro`) in flat-spin window.
   - wake-window word (for example `rota` or `sanctum`).
   - confirm load event + correct axis/slot behavior.
4. Verify shake detonation:
   - loaded wake-window words detonate on shake and consume correct slot.
5. Verify KWS readout:
   - candidate/readout surfaces show canonical word flow.
6. Confirm docs/artifacts regenerate cleanly:
   - run `npm run ready:v2` and `npm run status:v2`.

## Recommended Follow-Up
- Coordinate eventual removal of payload-level `spellId` aliases once all external consumers are confirmed migrated.
