# Enemies Runtime

Enemy runtime systems live here.

This domain owns live enemy instance creation, update loops, actor state,
behavior systems, movement, collision-facing data, and Three.js construction
for enemy models when those concerns are part of the enemy actor.

Content defaults are imported from `src/content/enemies/`. Runtime code must not
import from `labs/`.
