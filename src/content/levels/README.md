Authored level definitions live here.

This domain should own:
- level identity and labels
- world dimensions
- terrain/ground profiles
- authored spawn data
- future boundaries, collisions, decorators, and scripted level elements

Runtime shells such as `orb-stage` and `level-stage` should import level data
from here rather than owning level content themselves.
