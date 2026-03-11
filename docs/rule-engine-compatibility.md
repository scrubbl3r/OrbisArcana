# Rule Engine Compatibility

## Purpose
- Prevent config edits from drifting into compatibility files.
- Keep daily authoring in SSOT only.

## Edit Here (SSOT)
1. `src/content/interactions-v2/interactions-v2.js`
- Trigger/action chains (`rules`).

2. `src/content/interactions-v2/spellbook-v2.js`
- Spell inventory + `active` toggles.

3. `src/content/interactions-v2/entity-handles-v2.js`
- Canonical ALLCAPS handles glossary.

## Compatibility (Do Not Edit Daily)
1. `src/content/spells/runtime-spells.js`
- Runtime slot/cast routing compatibility layer.

2. `src/voice/spellbook.js`
- Compatibility runtime view derived from `spellbook-v2`.

3. `src/runtime/receiver-bootstrap.js`
- Runtime bootstrap wiring for compatibility and adapter startup.

## Cutover Status
- Runtime rule source: interactions adapter (`INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`)
- Projection-only rule execution: enabled (`RULE_ENGINE_MASTER_CONTROL.execution.projectionRulesOnly: true`)
- Drift gate: enforced by `npm run pre-smoke:v2`

## Commands
- `npm run pre-smoke:v2`
- `npm run report-drift:v2`
- `npm run doctor:v2`
- `npm run ready:v2`
