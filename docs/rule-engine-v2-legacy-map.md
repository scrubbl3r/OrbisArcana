# Rule Engine V2 Legacy Map

## Purpose
- Prevent config edits from drifting into legacy compatibility files.
- Keep daily authoring in V2 SSOT only.

## Edit Here (SSOT)
1. `src/content/interactions-v2/interactions-v2.js`
- Trigger/action chains (`rules`).

2. `src/content/interactions-v2/spellbook-v2.js`
- Spell inventory + `active` toggles.

3. `src/content/interactions-v2/entity-handles-v2.js`
- Canonical ALLCAPS handles glossary.

## Legacy/Compatibility (Do Not Author Daily)
1. `src/content/spells/runtime-spells.js`
- Runtime slot/cast routing compatibility layer.

2. `src/voice/spellbook.js`
- Legacy runtime view derived from `spellbook-v2`.

3. `src/runtime/receiver-bootstrap.js`
- Runtime bootstrap wiring that still exposes legacy alias keys for compatibility.

## Cutover Status
- Runtime rule source: V2 adapter (`INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`)
- Projection-only rule execution: enabled (`RULE_ENGINE_MASTER_CONTROL.execution.projectionRulesOnly: true`)
- Drift gate: enforced by `npm run pre-smoke:v2`

## Commands
- `npm run pre-smoke:v2`
- `npm run report-drift:v2`
- `npm run doctor:v2`
- `npm run ready:v2`
