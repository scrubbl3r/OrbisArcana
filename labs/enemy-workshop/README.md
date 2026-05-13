# Enemy Workshop

First-class Lab workspace for enemy authoring.

This workspace owns enemy archetype inspection, behavior tuning, preview
profiles, personality ranges, and publish contracts before stable values move
into production content.

## Intended Structure

- `enemy-surfaces.js` declares workshop-visible enemy archetype surfaces.
- `configs/` exposes visual, spawn, and personality control parameters.
- `behaviors/` owns reusable authoring-side enemy behavior configs.
- `enemy-workshop-preview-registry.js` maps enemy preview keys to preview renderers.
- `enemy-workshop-readouts.js` formats metadata and inspection readouts.
- `previews/` owns isolated enemy previews.
- `adapters/` owns settings capture/apply flow for enemy authoring.
- `publish/` owns writes from workshop profiles into production enemy content.

The workshop authors what an enemy is. Level authoring decides where enemy
instances or encounters live.

## Production Boundary

Production runtime code must not import from `labs/`.

- Stable enemy definitions belong in `src/content/enemies/`.
- Live runtime systems belong in `src/game-runtime/enemies/`.
- Enemy-specific VFX belong in `src/vfx/` only when they are reusable visual
  effects rather than actor behavior.
- Level spawn placement belongs in `src/content/levels/`.
