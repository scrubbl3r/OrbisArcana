RULE ENGINE V1 - SLICE 17 SMOKE CHECKLIST

Purpose
- Remove hardcoded class-spell list from `spell-rules-v1`.
- Source wake-window class list from routing config.

Quick Smoke (manual)
1) Source-of-truth check
- Open `src/content/spell-rules/spell-rules-v1.js`.
- Confirm wake window `spells` list is derived from `CLASS_SPELL_IDS`.

2) Config propagation test
- Temporarily edit `CLASS_SPELL_IDS` in `src/content/spells/spell-runtime-routing-v1.js`.
- Restart and verify rule wake window spell list reflects the change.
- Revert after test.
