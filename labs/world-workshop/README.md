# World Workshop

First-class Lab workspace for world object authoring.

This workspace owns object definitions and inspection tooling for props, spawn
anchors, scenery elements, room pieces, tunnel pieces, pickups, and other
authored world items.

## Intended Structure

- `world-item-surfaces.js` declares workshop-visible object surfaces.
- `configs/` exposes meaningful art and material control parameters.
- `behaviors/` owns reusable object motion and state-behavior configs.
- `preview-host.js` owns preview cleanup and DOM host reset conventions.
- `world-workshop-preview-registry.js` maps surface preview keys to preview renderers.
- `world-workshop-readouts.js` formats metadata and inspection readouts.
- `inspectors/` owns reusable viewport, camera, controls, resize, and cleanup behavior.
- `effects/` owns reusable scene and post-processing effects such as bloom.
- `rendering/` owns shared Three.js materials, edges, guides, and disposal helpers.
- `previews/` owns isolated and in-level object previews.
- `adapters/` owns settings capture/apply flow for object authoring.
- `generators/` owns procedural object builders such as plinths and columns.
- `publish/` owns writes from workshop profiles into production content.

The workshop authors what an object is. Level authoring decides where object
instances live.
