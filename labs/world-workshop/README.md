# World Workshop

First-class Lab workspace for world object authoring.

This workspace owns object definitions and inspection tooling for props, spawn
anchors, scenery elements, room pieces, tunnel pieces, pickups, and other
authored world items.

## Intended Structure

- `world-item-surfaces.js` declares workshop-visible object surfaces.
- `previews/` owns isolated and in-level object previews.
- `adapters/` owns settings capture/apply flow for object authoring.
- `generators/` owns procedural object builders such as plinths and columns.
- `publish/` owns writes from workshop profiles into production content.

The workshop authors what an object is. Level authoring decides where object
instances live.
