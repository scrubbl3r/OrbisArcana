# Rule Engine Authoring Entrypoint

## Daily Authoring Files (Primary)
1. `src/content/interactions-v2/interactions-v2.js`
- Edit trigger/action chains here (`rules`).
- This is the behavior SSOT target.

2. `src/content/interactions-v2/spellbook-v2.js`
- Edit spell inventory and `active` toggles here.
- This is the wake-word inventory SSOT.

## Reference File (Optional)
3. `src/content/interactions-v2/entity-handles-v2.js`
- Canonical ALLCAPS handles (human-friendly aliases).
- Use as glossary/reference for naming consistency.

## Runtime Bridge/Compatibility Files (Do Not Author Daily)
- `src/content/spell-rules/rule-engine-master-control.js` (runtime rule schema + defaults/overrides)
- `src/content/spell-rules/validate-rule-engine-config.js` (schema validator)
- `src/runtime/receiver-bootstrap.js` (bootstrap wiring + adapter flag routing)
- `src/voice/spellbook.js` (compatibility runtime view derived from `spellbook-v2`)

## Current Mode Switches
- `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap`
  - Location: `src/content/interactions-v2/interactions-v2.js`
  - Purpose: Runtime rule source cutover (must remain `true`).

- `RULE_ENGINE_MASTER_CONTROL.execution.projectionRulesOnly`
  - Location: `src/content/spell-rules/rule-engine-master-control.js`
  - Purpose: Require projected/runtime rules as the active rule source (must remain `true`).

## Authoring Rule of Thumb
- If you are changing gameplay interaction logic, edit `interactions-v2.js`.
- If you are enabling/disabling words, edit `spellbook-v2.js`.
- Avoid editing bridge/compatibility files unless doing migration plumbing.

## Quick Health Commands
- `npm run pre-smoke:v2`
  - Validates interactions config and regenerates effective snapshot.
- `npm run report-drift:v2`
  - Prints differences between projected runtime rules and effective interactions.
- `npm run doctor:v2`
  - Runs pre-smoke and prints concise SSOT health summary.
  - Also writes `docs/rule-engine-v2.health.json`.
- `npm run ready:v2`
  - Runs doctor and fails unless all cutover health gates are green.
