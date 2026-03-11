# Rule Engine V1 Slice 21 Smoke Checklist

## Purpose
- Derive spell signal definitions from routing/spellbook config instead of hardcoded entries.

## Quick Smoke (Manual)
1) Boot sanity
- Start receiver and confirm normal startup.

2) Signal derivation check
- Inspect `SIGNAL_DEFINITIONS_V1` at runtime and confirm spell signals exist for configured class/wake spell IDs.

3) Config propagation check
- Temporarily edit `CLASS_SPELL_IDS` or `WAKE_SPELL_IDS`.
- Restart and verify signal definitions update accordingly.
- Revert after test.
