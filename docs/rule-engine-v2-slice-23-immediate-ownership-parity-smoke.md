# Rule Engine V2 Slice 23 Smoke

## Goal
enforce parity between `interactions-v2` immediate spell rules and `RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS`.

## Validate
1. Run `npm run ready:v2`.
2. Confirm no parity errors.

## What this guard catches
- Missing IDs in `RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS` for immediate spell rules authored in `interactions-v2`.
- Extra IDs in `RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS` that are not represented by immediate spell rules.

## Expected
- Validation remains green with current migrated immediate spells.
