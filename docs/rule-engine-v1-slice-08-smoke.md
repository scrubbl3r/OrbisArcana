# Rule Engine V1 Slice 08 Smoke Checklist

## Purpose
- Remove hardcoded wake-required spell defaults from parser.
- Source wake-required IDs from routing config.

## Quick Smoke (Manual)
1) Config source check
- Open `src/content/spells/spell-runtime-routing-v1.js`.
- Confirm `WAKE_REQUIRED_SPELL_IDS` exists and includes desired IDs.

2) Parser behavior check
- With default config, confirm wake-required spell (currently `domus`) is blocked without wake and allowed with wake.

3) Data-driven toggle check
- Temporarily remove `domus` from `WAKE_REQUIRED_SPELL_IDS`.
- Confirm parser no longer requires wake for `domus`.
- Restore config after test.
