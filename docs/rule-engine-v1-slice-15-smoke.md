RULE ENGINE V1 - SLICE 15 SMOKE CHECKLIST

Purpose
- Remove dispatch dependency on `spell-decision-tree` class token normalizer.
- Source class-token runtime mapping from routing config.

Quick Smoke (manual)
1) Class token resolution baseline
- Trigger class-select flow (for example `rota`, `sanctum`, `vectus`).
- Confirm class resolution behavior remains valid.

2) Config-driven token map test
- Edit `CLASS_RUNTIME_KEY_BY_TOKEN` in `src/content/spells/spell-runtime-routing-v1.js`.
- Restart and confirm dispatch follows the new mapping.
- Revert after test.

3) Dependency check
- Confirm `src/systems/spell-dispatch-system.js` no longer imports from `src/voice/spell-decision-tree.js`.
