## SVG Map Taxonomy

The level SVG is an authoring source. Layer labels define broad buckets, and
child `inkscape:label` metadata defines item identity and actor-depth behavior.

### Layer Buckets

- `bounds`: playable collision/world boundary loops.
- `bounds_cam`: camera clamp boundary loops.
- `depths`: authored 3D depth surfaces. Child paths/rects own depth metadata.
- `art`: authored visual detail.
- `props`: world props that render in the actor lane unless specified otherwise.
- `fields`: non-collision field regions, such as ambient regions.
- `star_field`: non-collision 3D background star-field regions.
- `spawns`: player spawn points.
- `cameras`: camera anchors.
- `globes`: globe pickup/emitter actors.
- `enemies`: enemy spawn actors.
- `orb`: authored orb-lane metadata, such as the default orb z depth.

Hidden visual layers are not hydrated into runtime visual output. Hidden
`fields` can remain in the SVG as authoring/data scaffolding, but they do not
generate stars or allocate visual runtime resources unless made visible.

Layer order is authoritative for broad authored paint order. Lower SVG layers
render behind higher SVG layers; child shapes inherit their parent layer's stack
index. Runtime z metadata such as `z:orb` still controls physical 3D/gameplay
placement, while SVG stack order controls draw priority within authored world
content.

### Child Metadata

Metadata supports comma or whitespace separators, `key:value`, and `key=value`.
Examples:

```text
id: globe_01, z:orb
id:gnats_01 enemy:gnat-swarm z:orb
id: plinth_01 z:orb anchor:bottom
depth:reactor max=10bo z=4bo material=graphite tess=24
orb: z=4bo
```

Important keys:

- `id`: runtime identity. Prefer stable snake-case ids.
- `z:orb`: places actor-lane items at the current orb zBO.
- `z:4bo`: places the item at an explicit fixed depth.
- `anchor`: prop placement anchor, currently `center`, `top`, `bottom`, or `base`.
- `enemy` / `archetype`: enemy archetype id to instantiate from an enemy spawn.
- `depth:<name>`: marks a child shape as a depth layer source.
- `orb: z=<n>bo`: defines the default orb travel depth independently of
  depth geometry.
- `max`, `material`, `tess`: depth-layer rendering metadata.

Authoring rule: actor items such as props, globes, pickups, enemies, and
projectiles should declare `z:orb` unless they intentionally live on another
depth lane.
