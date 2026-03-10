# Rule Engine V2 Authoring Entrypoint

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
- `src/content/spell-rules/spell-rules-v1.js` (legacy bridge/static fallback)
- `src/runtime/receiver-bootstrap.js` (bootstrap wiring + V2 flag routing)
- `src/voice/spellbook.js` (legacy runtime view derived from `spellbook-v2`)

## Current Mode Switches
- `INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap`
  - Location: `src/content/interactions-v2/interactions-v2.js`
  - Purpose: Runtime rule source cutover (must remain `true`).

- `SPELL_RULES_V1_LEGACY_BRIDGE.useInteractionsV2Rules`
  - Location: `src/content/spell-rules/spell-rules-v1.js`
  - Purpose: Keep legacy V1 sample view sourced from V2 projection (must remain `true`).

## Authoring Rule of Thumb
- If you are changing gameplay interaction logic, edit `interactions-v2.js`.
- If you are enabling/disabling words, edit `spellbook-v2.js`.
- Avoid editing legacy bridge files unless doing migration plumbing.

## Quick Health Commands
- `npm run pre-smoke:v2`
  - Validates V2 config and regenerates effective snapshot.
- `npm run report-drift:v2`
  - Prints differences between legacy static V1 fallback rules and V2 projection.
- `npm run doctor:v2`
  - Runs pre-smoke and prints concise SSOT health summary.
