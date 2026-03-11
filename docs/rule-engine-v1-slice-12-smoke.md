# RULE ENGINE V1 - SLICE 12 SMOKE CHECKLIST

## Purpose
- Move spell-window bypass IDs from hardcoded dispatch list to routing config.

## Quick Smoke (Manual)
1) Baseline behavior
- Confirm current voice/dispatch behavior is unchanged with default config.

2) Config-driven bypass test
- In `src/content/spells/spell-runtime-routing-v1.js`, edit `SPELL_WINDOW_BYPASS_SPELL_IDS`.
- Remove one existing id and restart; verify it no longer bypasses spell-window gate.
- Add it back and verify behavior restores.

3) Source of truth check
- Confirm `src/systems/spell-dispatch-system.js` no longer hardcodes bypass IDs.
