# World Workshop

First-class Lab workspace for world object authoring.

This workspace owns object definitions and inspection tooling for props, spawn
anchors, scenery elements, room pieces, tunnel pieces, pickups, and other
authored world items.

## Intended Structure

- `world-item-surfaces.js` declares workshop-visible object surfaces.
- `world-workshop-preview-registry.js` maps surface preview keys to preview renderers.
- `world-workshop-readouts.js` formats metadata and inspection readouts.
- `inspectors/` owns reusable viewport, camera, controls, resize, and cleanup behavior.
- `rendering/` owns shared Three.js materials, edges, guides, and disposal helpers.
- `previews/` owns isolated and in-level object previews.
- `adapters/` owns settings capture/apply flow for object authoring.
- `generators/` owns procedural object builders such as plinths and columns.
- `publish/` owns writes from workshop profiles into production content.

The workshop authors what an object is. Level authoring decides where object
instances live.
