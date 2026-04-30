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

3D depth-layer rendering lives here as runtime rendering logic:
- `depth-projection.js` owns camera/depth projection math.
- `depth-runtime-coordinates.js` owns world-to-depth-Three coordinate
  conversion and depth spawn anchor resolution.
- `depth-stage-frame.js` owns reusable depth-stage frame normalization,
  boot-frame resolution, and camera-frame values.
- `depth-layer-3d-mesh.js` owns depth-layer SVG/vector rasterization and
  Three.js mesh construction.

Stage shells may choose cameras, scene groups, and visibility policy, but should
delegate reusable depth-layer geometry and camera-frame calculations to this
domain.
