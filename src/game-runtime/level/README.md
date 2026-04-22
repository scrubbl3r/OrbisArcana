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
