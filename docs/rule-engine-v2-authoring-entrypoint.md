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
  - Purpose: Switch runtime rule source between V1 master and V2 adapter.

- `SPELL_RULES_V1_LEGACY_BRIDGE.useInteractionsV2Rules`
  - Location: `src/content/spell-rules/spell-rules-v1.js`
  - Purpose: Optional V2 projection for legacy V1 rule sample list.

## Authoring Rule of Thumb
- If you are changing gameplay interaction logic, edit `interactions-v2.js`.
- If you are enabling/disabling words, edit `spellbook-v2.js`.
- Avoid editing legacy bridge files unless doing migration plumbing.
