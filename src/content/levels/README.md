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
- `level-*/` packages are the preferred home for per-level authored assets such
  as SVG map templates, manifests, and level-specific metadata

Runtime shells such as `orb-stage` and `level-stage` should import level data
from here rather than owning level content themselves.
