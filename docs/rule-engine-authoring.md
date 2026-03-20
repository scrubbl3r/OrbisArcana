# Rule Engine Authoring

Related index:
- `docs/rule-engine-v2-docs-index.md`


## Daily Authoring Files (Primary)
- `src/content/interactions-v2/interactions-v2.js`
  - Edit trigger/action chains here (`rules`).
  - This is the behavior SSOT source.
- `src/content/interactions-v2/wordbook-v2.js`
  - Edit word inventory and `active` toggles here.
  - This is the wake-word inventory SSOT source.
  - Compatibility alias: `src/content/interactions-v2/spellbook-v2.js`

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
- `src/voice/spellbook.js` (compatibility alias runtime view)

## Runtime Switches
- `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap`
  - Location: `src/content/interactions-v2/interactions-v2.js`
  - Purpose: Must remain `true`; otherwise runtime enters safe-disabled mode.
- `RULE_ENGINE_POLICY_CONTROL.execution.projectionRulesOnly`
  - Location: `src/content/spell-rules/rule-engine-master-control.js`
  - Purpose: Require projected/runtime rules as the active rule source (must remain `true`).

## Runtime Source IDs
- Defined in: `src/runtime/receiver-bootstrap.js`
- Canonical list and semantics: `docs/rule-engine-compatibility.md` (Runtime Mode Status).

## Authoring Rule of Thumb
- If you are changing gameplay interaction logic, edit `interactions-v2.js`.
- If you are enabling/disabling words, edit `wordbook-v2.js` (compatibility alias: `spellbook-v2.js`).
- Avoid editing runtime integration files unless you are doing intentional system/runtime wiring work.

## Quick Health Checks
- `npm run pre-smoke:v2`
  - Validates interactions config and regenerates effective snapshot.
- `npm run report-drift:v2`
  - Prints differences between projected runtime rules and effective interactions.
- `npm run doctor:v2`
  - Runs pre-smoke and prints concise SSOT health summary.
  - Output file: `docs/rule-engine-v2.health.json`.
- `npm run ready:v2`
  - Runs doctor and fails unless all health gates are green.
