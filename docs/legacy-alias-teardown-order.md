# Legacy Alias Teardown Order

## Goal
Remove legacy `spell*` naming aliases in controlled phases while keeping runtime behavior stable and `npm run ready:v2` green at each step.

## Guardrails
- Keep compatibility exports until final phase.
- Prefer internal/local renames first.
- Run `npm run ready:v2` after every phase.
- If a phase fails, revert only that phase and continue with smaller slices.

## Phase 1 (Internal Naming Only)
- Scope:
  - Internal helper/local variable naming in interactions/compiler/runtime paths.
  - No public export removals.
- Status:
  - Completed.

## Phase 2 (Internal Fallback Removal)
- Scope:
  - Remove internal fallback reads that prefer legacy aliases when canonical word surfaces are already available.
  - Keep compatibility exports/shims untouched.
- Candidate files:
  - `src/runtime/receiver-bootstrap.js`
  - `src/content/spells/validate-spell-runtime-routing.js`
  - `src/content/spells/validate-spell-schema-integrity.js`
- Status:
  - Completed.

## Phase 3 (Tooling Canonicalization)
- Scope:
  - Check/tool internals use canonical word naming only.
  - Keep explicit compatibility checks where contract coverage requires legacy references.
- Candidate paths:
  - `tools/rule-engine-v2/*`
- Status:
  - Completed.

## Phase 4 (Public Alias Deprecation Window)
- Scope:
  - Keep legacy exports, but mark as deprecated in comments/docs.
  - Update docs to canonical `word*` names as default.
- Status:
  - Completed.

## Phase 5 (Public Alias Removal)
- Scope:
  - Remove deprecated legacy alias surfaces after consumer migration.
- Removed in this project:
  - runtime routing aliases:
    - `SPELL_RUNTIME_ROUTING`
    - `SPELL_RUNTIME_ROUTING_TABLE`
    - `SPELL_RUNTIME_ROUTING_BY_WORD_ID`
  - runtime content aliases:
    - `RUNTIME_SPELLS`
    - `RUNTIME_SPELLS_BY_ID`
    - `getRuntimeSpellById`
  - VFX aliases:
    - `SPELL_VFX_BINDINGS`
    - `SPELL_VFX_BINDINGS_BY_SPELL_ID`
    - `getSpellVfxBinding`
  - bootstrap context aliases:
    - `setRuntimeSpellIndexes`
    - `initSpellActionHandlers`
- Exit criteria:
  - Zero non-compat references to legacy symbols.
  - `npm run ready:v2` green.
  - Smoke pass in receiver runtime.
- Status:
  - Completed for the alias set above.

## Remaining High-Risk Surfaces
- Event payload compatibility fields: `spellId` aliases in emitted runtime events.
- These payload aliases are intentionally retained for wire-compat and should be removed only with coordinated consumer upgrades.

## Post-Teardown State
- Canonical naming is now `word*` across active runtime and tooling surfaces.
- Legacy alias exports/hooks listed above are removed.
- Remaining legacy compatibility is limited to selected event payload alias fields (`spellId`) and dedicated spellbook bridge/shim contracts validated by `ready:v2`.

## Execution Pattern
1. Make one phase-sized batch.
2. Run `npm run ready:v2`.
3. If green, continue.
4. If red, split phase into smaller sub-batches.
