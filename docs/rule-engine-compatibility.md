# Rule Engine Compatibility

## Purpose
- Prevent config edits from drifting into bridge files.
- Keep daily authoring in SSOT only.

## Edit Here (SSOT Sources)
1. `src/content/interactions-v2/interactions-v2.js`
- Trigger/action chains (`rules`).

2. `src/content/interactions-v2/spellbook-v2.js`
- Spell inventory + `active` toggles.

3. `src/content/interactions-v2/entity-handles-v2.js`
- Canonical ALLCAPS handles glossary.

## Bridge Files (Do Not Edit Daily)
1. `src/content/spells/runtime-spells.js`
- Runtime slot/cast routing bridge layer.

2. `src/voice/spellbook.js`
- Runtime view derived from `spellbook-v2`.

3. `src/runtime/receiver-bootstrap.js`
- Runtime bootstrap wiring for bridge/adaptation startup.

## Runtime Status
- Runtime rule source: interactions adapter (`INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`)
- Projection-only rule execution: enabled (`RULE_ENGINE_MASTER_CONTROL.execution.projectionRulesOnly: true`)
- Drift gate: enforced by `npm run pre-smoke:v2`

## Commands
- `npm run pre-smoke:v2`
- `npm run report-drift:v2`
- `npm run doctor:v2`
- `npm run ready:v2`
