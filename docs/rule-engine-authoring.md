# Rule Engine Authoring

Related index:
- `docs/rule-engine-v2-docs-index.md`

Preflight:
- Run `npm run status:v2` before editing to confirm current v2 health and contracts are green.

## Daily Authoring Files (Primary)
- `src/content/interactions-v2/dream-config-v2.js`
  - Edit trigger/action chains here (`rules`).
  - This is the behavior SSOT source.
  - Author wake windows and trigger chains directly in `wake`, `groups`, and `rules`.
- `src/content/interactions-v2/wordbook-v2.js`
  - Edit word inventory and `active` toggles here.
  - This is the word inventory SSOT source.

## Reference File (Optional)
- `src/content/interactions-v2/entity-handles-v2.js`
  - Canonical ALLCAPS handles (human-friendly aliases).
  - Use as glossary/reference for naming consistency.

## Runtime Integration Files (Do Not Edit Daily)
- `src/content/spell-rules/rule-engine-master-control.js` (runtime rule schema + defaults/overrides)
- `src/content/spell-rules/validate-rule-engine-config.js` (schema validator)
- `src/content/spells/runtime-spells.js` (runtime slot/cast routing integration layer)
- `src/runtime/receiver-bootstrap.js` (bootstrap wiring + adapter flag routing)
- `src/voice/wordbook.js` (runtime view derived from `wordbook-v2`)

## Runtime Switches
- `ORCHESTRATOR_V2_BOOTSTRAP.useInReceiverBootstrap`
  - Location: `src/content/interactions-v2/orchestrator-v2.js`
  - Purpose: Enables orchestrator-v2 bootstrap in receiver fallback/precedence flow.
- `RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly`
  - Location: `src/content/spell-rules/rule-engine-master-control.js`
  - Purpose: Require projected/runtime rules as the active rule source (must remain `true`).

## Runtime Source IDs
- Defined in: `src/runtime/receiver-bootstrap.js`
- Canonical list and semantics: `docs/rule-engine-compatibility.md` (Runtime Mode Status).

## Authoring Rule of Thumb
- If you are changing gameplay interaction logic, edit `dream-config-v2.js`.
- If you are enabling/disabling words, edit `wordbook-v2.js`.
- Avoid editing runtime integration files unless you are doing intentional system/runtime wiring work.

## Dream DSL Guardrails (Canonical)
- Top-level `dream-config-v2` keys are restricted to:
  - `version`, `enabled`, `defaults`, `wake`, `groups`, `rules`
- `wake` must be object form and must include non-empty `wake.words`.
- `rules[]` entries must be objects with `id`.
- `rule.on` and `rule.open` must be object form (no shorthand string/array).
- Legacy alias keys are rejected in dream authoring:
  - `wake.word` / `wake.spells`
  - `rule.on.spell`
  - `rule.open.word` / `rule.open.spells`
- Unknown keys under root/wake/rule/on/open fail validation to keep authoring predictable.

## Quick Health Checks
- `npm run status:v2`
  - Prints current v2 health, contract, and regression status summary and writes `docs/rule-engine-v2.status.json`.
- `npm run pre-smoke:v2`
  - Validates dream-config/wordbook config and regenerates effective snapshot.
- `npm run report-drift:v2`
  - Prints projection drift details when interactions projection checks are enabled.
- `npm run doctor:v2`
  - Runs pre-smoke and prints concise SSOT health summary.
  - Output file: `docs/rule-engine-v2.health.json`.
- `npm run ready:v2`
  - Runs doctor and fails unless all health gates are green.
