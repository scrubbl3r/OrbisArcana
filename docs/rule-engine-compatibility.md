# Rule Engine Compatibility

Related index:
- `docs/rule-engine-v2-docs-index.md`

Preflight:
- Run `npm run status:v2` before compatibility checks to confirm current v2 health and contracts are green.

## Purpose
- Prevent config edits from drifting into runtime integration files.
- Keep authoring edits in SSOT sources only.

## Authoring Sources (SSOT)
- `src/content/interactions-v2/compiled-interaction-graph-v2.js`
  - Trigger/action chains (`rules`, `open`, `trigger`).
- `src/content/interactions-v2/wordbook-v2.js`
  - Word inventory + `active` toggles.
- `src/content/interactions-v2/entity-handles-v2.js`
  - Canonical ALLCAPS handles glossary.

## Runtime Integration Files (Do Not Edit Daily)
- `src/content/spell-rules/rule-engine-master-control.js`
  - Runtime rule schema + default/override control surface.
- `src/content/spell-rules/validate-rule-engine-config.js`
  - Runtime config validator for rule engine policy/shape checks.
- `src/content/spells/runtime-spells.js`
  - Runtime slot/cast routing integration layer.
- `src/runtime/receiver-bootstrap.js`
  - Runtime bootstrap wiring for orchestrator + interactions adapter startup.

## Runtime Mode Status
- Runtime rule source family: orchestrator-v2 and interactions-adapter fallback (selected by bootstrap policy + safety fallback)
- Projection-only rule execution: enabled (`RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly: true`)
- Drift gate: enforced by `npm run pre-smoke:v2`
- Runtime source IDs (authoritative): `src/runtime/receiver-bootstrap.js`
  - `orchestrator_v2`
  - `orchestrator_v2_fallback`
  - `orchestrator_v2_disabled`
  - `orchestrator_v2_missing_builder`
  - `interactions_adapter`
  - `interactions_adapter_fallback`
  - `interactions_bootstrap_disabled`
  - `interactions_adapter_missing_builder`

## Operations
- Primary operational runbook: `docs/rule-engine-smoke.md`
- Supplemental diagnostics:
  - `npm run report-drift:v2` (projection/runtime drift detail)
  - `npm run doctor:v2` (health summary artifact refresh)
  - `npm run status:v2` (current v2 status summary + status artifact refresh)
