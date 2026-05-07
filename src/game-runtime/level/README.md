Level runtime owns the execution side of authored levels.

This domain should grow to contain:
- level definition normalization
- authored asset import/parsing
- level runtime state and lifecycle
- element instantiation/update/query logic
- boundary/collision processing
- trigger evaluation
- stage-facing read models for rendering/debugging

Three-layer model:
- `src/content/levels/` defines authored source
- `src/game-runtime/level/` defines normalized level/runtime behavior
- `src/runtime-shell/staging/` presents level runtimes in shell surfaces

Runtime shells should consume level runtime/definitions from here rather than
inventing their own level ownership model.

Verification:
- `npm run check:levels` is the level schema/runtime smoke. It covers the
  normalized registry contract, authored world-size SSOT, SVG source hydration
  contract, fixture integrity, and SVG inspection summaries for canonical
  authored levels.
- `tools/levels/inspect-level-svg.mjs <level-id> --summary` prints the compact
  SVG schema count smoke. `--json` emits the structured report used by
  `check:levels`.
- `tools/levels/level-contract-fixtures.mjs` is the test-side fixture SSOT for
  canonical ids and expected inspection counts. It should be updated alongside
  `src/content/levels/registry.js` when a new level graduates into the canon.

Authored scene SSOT:
- `load-authored-level-scene.js` fetches an authored SVG once per scene load,
  summarizes it, builds the scene model, and builds stage-facing graphics models.
  Shells and stages should consume that read model instead of parsing SVGs
  independently.
- `authored-level-read-model.js` owns scene-model-first accessors for consumers
  that need arrays, boxes, or spawn points from an authored read model. Shells
  should use these helpers instead of duplicating `sceneModel` / `summary`
  fallback logic. Its `AUTHORED_LEVEL_READ_MODEL_KEY_*` exports are the
  canonical field names for shared read-model access.
- `svg-level-summary-options.js` owns the normalized `mapSource.semanticLayers`
  to `summarizeSvgLevelSource()` option mapping. Runtime loaders and inspection
  tools should use it instead of hand-wiring SVG layer buckets.
- `resolve-level-world-size.js` owns the canonical fallback ladder for authored
  world dimensions: map scale, level world size, authoring viewBox, then a hard
  fallback.

3D depth-layer rendering lives here as runtime rendering logic:
- `depth-projection.js` owns camera/depth projection math.
- `depth-runtime-coordinates.js` owns world-to-depth-Three coordinate
  conversion and depth spawn anchor resolution.
- `depth-stage-frame.js` owns reusable depth-stage frame normalization,
  boot-frame resolution, and camera-frame values.
- `depth-layer-3d-mesh.js` owns depth-layer SVG/vector rasterization and
  Three.js mesh construction.

BO scale authority:
- SVG depth labels such as `depth:reactor max=10bo z=4bo` are authored in BO
  units.
- Runtime BO is the canonical Orb Base visual diameter, supplied by the
  stage/runtime owner. The level runtime should receive that value and thread it
  into depth geometry, props, globes, and telemetry.
- `LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS` exists only for isolated factory/default
  fallback paths. It must not become the authoritative BO value for a live
  stage.

Stage shells may choose cameras, scene groups, and visibility policy, but should
delegate reusable depth-layer geometry and camera-frame calculations to this
domain.
