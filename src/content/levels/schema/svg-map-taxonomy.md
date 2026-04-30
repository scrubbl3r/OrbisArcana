## SVG Map Taxonomy

The level SVG is an authoring source. Layer labels define broad buckets, and
child `inkscape:label` metadata defines item identity and actor-depth behavior.

### Layer Buckets

- `bounds`: playable collision/world boundary loops.
- `bounds_cam`: camera clamp boundary loops.
- `depths`: authored 3D depth surfaces. Child paths/rects own depth metadata.
- `art`: authored decorative line art.
- `props`: world props that render in the actor lane unless specified otherwise.
- `fields`: non-collision field regions, such as star/ambient regions.
- `spawns`: player spawn markers.
- `cameras`: camera anchors.
- `globes`: globe pickup/emitter actors.

### Child Metadata

Metadata supports comma or whitespace separators, `key:value`, and `key=value`.
Examples:

```text
id: globe_01, z:orb
id: plinth_01 z:orb anchor:bottom
depth:reactor max=10bo z=4bo material=graphite tess=24
```

Important keys:

- `id`: runtime identity. Prefer stable snake-case ids.
- `z:orb`: places actor-lane items at the current orb zBO.
- `z:4bo`: places the item at an explicit fixed depth.
- `anchor`: prop placement anchor, currently `center`, `top`, `bottom`, or `base`.
- `depth:<name>`: marks a child shape as a depth layer source.
- `max`, `material`, `tess`: depth-layer rendering metadata.

Authoring rule: actor items such as props, globes, pickups, enemies, and
projectiles should declare `z:orb` unless they intentionally live on another
depth lane.
