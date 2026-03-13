# Rule Engine Compatibility

Related index:
- `docs/rule-engine-v2-docs-index.md`


## Purpose
- Prevent config edits from drifting into runtime integration files.
- Keep daily authoring in SSOT sources only.

## Authoring Sources (SSOT)
- `src/content/interactions-v2/interactions-v2.js`
  - Trigger/action chains (`rules`).
- `src/content/interactions-v2/spellbook-v2.js`
  - Spell inventory + `active` toggles.
- `src/content/interactions-v2/entity-handles-v2.js`
  - Canonical ALLCAPS handles glossary.

## Runtime Integration Files (Do Not Edit Daily)
- `src/content/spell-rules/rule-engine-master-control.js`
  - Runtime rule schema + default/override control surface.
- `src/content/spell-rules/validate-rule-engine-config.js`
  - Runtime config validator for rule engine policy/shape checks.
- `src/content/spells/runtime-spells.js`
  - Runtime slot/cast routing integration layer.
- `src/voice/spellbook.js`
  - Runtime view derived from `spellbook-v2`.
- `src/runtime/receiver-bootstrap.js`
  - Runtime bootstrap wiring for adapter startup.

## Runtime Mode Status
- Runtime rule source: interactions adapter (`INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap: true`)
- Projection-only rule execution: enabled (`RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly: true`)
- Drift gate: enforced by `npm run pre-smoke:v2`
- Runtime source IDs (authoritative): `src/runtime/receiver-bootstrap.js`
  - `interactions_adapter`
  - `interactions_adapter_fallback`
  - `interactions_bootstrap_disabled`
  - `interactions_adapter_missing_builder`

## Operations
- Primary operational runbook: `docs/rule-engine-smoke.md`
- Supplemental diagnostics:
  - `npm run report-drift:v2` (projection/runtime drift detail)
  - `npm run doctor:v2` (health summary artifact refresh)
