World runtime domain home.

This subtree owns reusable runtime behavior and Three.js construction for world
objects.

## Ownership

- `globe-3d-model.js` and `globe-3d-material.js` own reusable globe geometry
  and material construction.
- `world-globe-3d-runtime.js` owns world-side globe pickup state, placement, and
  idle animation.
- `props/` owns reusable world prop models and prop runtime placement.

Stage shells may choose scene groups and coordinate conversion, but world object
mesh construction, placement rules, and runtime state should live here.

