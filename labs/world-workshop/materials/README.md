# World Workshop Materials

This directory is the canonical material library for World Workshop authored objects.

## Orb

`orb/opalescent-orb-config.js` and `orb/opalescent-orb-material.js` own the 3D orb visual material system:

- translucent opalescent shell shader
- orb light configuration and color drift
- optional shadow spot fallback hooks

The `Orb` workshop entry should be the source-of-truth preview for this material before it is adapted into game-facing orb states.

## Graphite

`graphite/graphite-config.js` and `graphite/graphite-material.js` own the reusable graphite surface look:

- graphite/eggshell face material
- procedural roughness/bump texture
- vector edge styling controls
- assembly-scale test controls

The `Plinth` workshop entry is the first world-furniture object applying this graphite look. Assemblies should compose the plinth and graphite material rather than redefining either.

## Effects Boundary

Bloom and other post-processing systems live in `../effects/`. Materials may
carry emissive or lighting-response settings, but the viewport pipeline owns the
actual effect pass.

## Compatibility

The older `materials/plinth/*`, `configs/*-material-config.js`, and `rendering/*-materials.js` modules re-export this library during the transition. New World Workshop code should import from `materials/graphite/*` directly.
