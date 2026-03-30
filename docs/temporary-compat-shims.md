# Temporary Compatibility Shims

These files are temporary migration scaffolding. They are not intended to be
permanent architecture.

When their import surfaces have been fully updated, delete them.

## Current Shim Files

- `src/spells/shockwave.js`
- `src/spells/teleport-home.js`
- `src/systems/orb-runtime-state.js`
- `src/systems/orb-runtime-pipeline.js`
- `src/systems/orb-runtime-loop.js`
- `src/systems/orb-fx-system.js`
- `src/ui/kws-panel-controller.js`
- `src/ui/word-flashboard-popup.js`

## Rule

- Prefer direct moves with import updates.
- Only leave a shim when it materially reduces migration risk.
- If a shim is introduced, add it here immediately and retire it soon.
