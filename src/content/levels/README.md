Authored level definitions live here.

This domain should own:
- level identity and labels
- world dimensions
- terrain/ground profiles
- authored spawn data
- future boundaries, collisions, decorators, and scripted level elements

Supporting structure:
- `registry.js` is the shared source-side entry point for known levels
- `shared/` is the home for cross-level authored assets and conventions
- `schema/` holds authored shape conventions and validation notes
- `elements/` is the adjacent home for reusable level element families
- per-level packages are the preferred home for authored assets such
  as SVG map templates, manifests, and level-specific metadata

Runtime stages such as `orb-stage` and `game-stage` should import level data
from here rather than owning level content themselves.

Verification:
- `npm run check:levels` verifies the normalized level registry, authored world
  sizing, SVG layer hydration contract, and canonical SVG inspection summaries.
- `tools/levels/level-contract-fixtures.mjs` is the test-side fixture SSOT for
  canonical level ids, expected world sizes, semantic layer labels, and SVG
  inspection counts. Add new authored levels there when they become canonical.
