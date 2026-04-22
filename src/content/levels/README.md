Authored level definitions live here.

This domain should own:
- level identity and labels
- world dimensions
- terrain/ground profiles
- authored spawn data
- future boundaries, collisions, decorators, and scripted level elements

Supporting structure:
- `registry.js` is the shared source-side entry point for known levels
- `schema/` holds authored shape conventions and validation notes
- `elements/` is the adjacent home for reusable level element families

Runtime shells such as `orb-stage` and `level-stage` should import level data
from here rather than owning level content themselves.
