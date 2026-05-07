Level schema notes live here.

This is the home for:
- source-shape conventions for authored levels
- field ownership rules
- element bucket definitions
- future validation/defaulting notes

Current intended authored level shape:
- identity: `id`, `label`
- world: dimensions and broad world bounds
- terrain: `terrain.profile`
- map source: SVG asset, canonical semantic layer buckets, and `primarySpawn`
- authored elements: `elements.boundaries`, `elements.worldItemSpawns`, and future hazards, triggers, decorators
- optional metadata/debug annotations that do not duplicate runtime buckets

This folder is for schema guidance and adjacent helpers, not live runtime logic.

See also:
- [SVG map taxonomy](./svg-map-taxonomy.md)
