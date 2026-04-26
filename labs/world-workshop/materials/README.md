# World Workshop Materials

This directory is the canonical material library for World Workshop authored objects.

## Orb

`orb/opalescent-orb-config.js` and `orb/opalescent-orb-material.js` own the 3D orb visual material system:

- translucent opalescent shell shader
- orb light configuration and color drift
- bloom configuration used by World Workshop inspectors
- optional shadow spot fallback hooks

The `Orb` workshop entry should be the source-of-truth preview for this material before it is adapted into game-facing orb states.

## Plinth

`plinth/graphite-plinth-config.js` and `plinth/graphite-plinth-material.js` own the first plinth/world-object surface:

- graphite/eggshell face material
- procedural roughness/bump texture
- vector edge styling controls
- assembly-scale test controls

The `Orb Spawn Plinth` workshop entry should be the source-of-truth preview for this material and geometry. Assemblies should compose it rather than redefining it.

## Compatibility

The older `configs/*-material-config.js` and `rendering/*-materials.js` modules re-export this library during the transition. New World Workshop code should import from `materials/*` directly.
