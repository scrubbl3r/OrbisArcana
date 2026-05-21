# Level Nav

Shared runtime navigation utilities for authored levels.

The stage builds level navigation once when a scene loads, then enemies and
future actor systems can query the same grid instead of each actor scanning the
map independently.

The first pass is a walkable grid generated from authored boundary loops. Tune
grid density with `LEVEL_NAV_GRID_RESOLUTION_BO` in `level-nav-grid.js`.

Consumers should depend on the generic context returned by
`createLevelNavContext`, not on enemy-specific helpers. The context exposes the
shared route, distance, walkability, and random-point queries used by enemies,
spells, and future actor systems.
