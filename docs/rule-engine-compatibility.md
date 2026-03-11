# Rule Engine Compatibility

Related index:
- `docs/rule-engine-v2-docs-index.md`

## Purpose
- Prevent config edits from drifting into bridge files.
- Keep daily authoring in SSOT sources only.

## Authoring Sources (SSOT)
- `src/content/interactions-v2/interactions-v2.js`
  - Trigger/action chains (`rules`).
- `src/content/interactions-v2/spellbook-v2.js`
  - Spell inventory + `active` toggles.
- `src/content/interactions-v2/entity-handles-v2.js`
  - Canonical ALLCAPS handles glossary.

## Bridge Files (Do Not Edit Daily)
- `src/content/spells/runtime-spells.js`
  - Runtime slot/cast routing bridge layer.
- `src/voice/spellbook.js`
  - Runtime view derived from `spellbook-v2`.
- `src/runtime/receiver-bootstrap.js`
  - Runtime bootstrap wiring for bridge/adaptation startup.

## Runtime Mode Status
- Runtime rule source: interactions adapter (`INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`)
- Projection-only rule execution: enabled (`RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly: true`)
- Drift gate: enforced by `npm run pre-smoke:v2`
- Runtime source IDs (authoritative): `src/runtime/receiver-bootstrap.js`
  - `interactions_adapter`
  - `interactions_adapter_fallback`
  - `interactions_bootstrap_disabled`
  - `interactions_adapter_missing_builder`

## Commands
- `npm run pre-smoke:v2`
- `npm run report-drift:v2`
- `npm run doctor:v2`
- `npm run ready:v2`
