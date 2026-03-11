# RULE ENGINE V1 - SLICE 06 SMOKE CHECKLIST

## Purpose
- Cut spellbook to recognition-only fields.
- Move behavior/routing metadata into `spell-runtime-routing-v1`.

## Quick Smoke (Manual)
1) Spellbook sanity
- Open `src/voice/spellbook.js`.
- Confirm entries only include recognition fields:
  `active`, `id`, `phrase`, `onnxModel`, `minConfidence`, `cooldownMs`.

2) Wake active toggle still works
- Set `orbis.active = false`.
- Confirm wake no longer triggers.
- Set back to `true`, confirm wake can trigger again.

3) Existing cast path still alive
- Trigger a known spell phrase (for example `vectus`).
- Confirm parser/detection path still emits spell events.

4) Routing metadata location
- Open `src/content/spells/spell-runtime-routing-v1.js`.
- Confirm intent/axis/slot/class/school/wake IDs live there (not spellbook).
