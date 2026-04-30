# Orbis Arcana 3D Runtime Direction

Date: 2026-04-28
Branch: `04/28/26-Orbis-Arcana-3D`

## Decision

Orbis Arcana is moving toward a full 3D runtime. The 2D/SVG system remains valuable for authoring, placement, layout, debug overlays, and simple collision authoring, but it is no longer intended to be a permanent player-facing fallback renderer.

The 3D orb should become the runtime truth for visual position, material response, lighting, and perceived contact with the world.

## Base Orb And BO

`BO` should be treated as a canonical gameplay/world measure, not as a 2D DOM artifact.

- `1 BO` is the canonical orb diameter in world units.
- `0.5 BO` is the canonical orb radius.
- Orb Base owns the gameplay scale contract: radius, diameter, collision scale, spell scale, pickup/orbit relationships, and any system that needs orb-sized units.
- Orb 3D owns material, shell, light, shadow, displacement, and render-tuning parameters.
- A runtime orb should be understood as a sphere centered at `(xW, yW, zBO)` with radius `0.5 BO`.
- SVG-authored BO fields, such as `max=10bo`, `z=4bo`, and prop depth labels, resolve through Orb Base at runtime rather than through a level-local unit.
- Any fallback BO constant is fallback-only. Live stage code must pass the resolved Orb Base diameter into depth, prop, globe, and telemetry runtimes.

The existing 2D orb can remain temporarily as a debug/ghost layer, but it should not define the future runtime truth.

## Bounds, Depth, And Collision

Bounds and depth are intentionally separate authoring concepts, even when they are currently aligned.

- `depth:*` layers describe visual/spatial 3D relief or object form.
- `bounds` describes the simplified gameplay collision contract.
- `line_art` describes authored visual detail.
- Future object layers may add placed geometry, hazards, pickups, occluders, doors, props, or bespoke collision.

Do not permanently combine bounds and depth. They may be identical in early maps, but separating them preserves the ability to author rich visual geometry with simple, intentional collision geometry.

In the 3D runtime, the bounds layer should be treated as source geometry for a collision volume, not merely as a forever-2D collision line. For a depth cavity:

- The authored bounds/depth source gives the opening contour.
- `maxDepthBO` gives the cavity depth.
- The renderer builds side surfaces from the opening to the back plane.
- The collision system derives matching 3D collision surfaces or z-slices.
- An orb at `z = 4BO` collides according to its actual 3D placement, not blindly against only the front opening line.

This avoids small offsets/fudges and keeps future z tuning mathematically coherent.

## Perspective vs Orthographic

Orthographic projection would make 2D/3D alignment simple, but the preferred visual direction is full perspective because it gives the game real depth, converging lines, parallax, lighting drama, and mood.

The cost of perspective is that collision must be modeled as 3D geometry or z-aware slices rather than assuming the SVG front contour is always the visual contact contour.

Recommendation: keep perspective, but move collision toward proper 3D sphere-vs-cavity-surface math.

## Orb Z Lanes And Depth Fields

The future-forward idea is authored orb depth behavior.

The simplest version is an authored z lane:

- Default orb travel depth, such as `z = 4BO`.
- Special authored paths or regions where the orb eases deeper or forward.
- Example: a tunnel pulls the orb from `4BO` to `7BO`; a foreground pickup pulls it to `2BO`.

The stronger version is a depth field over 2D play space:

```text
orb z = f(x, y)
```

This lets the player keep simple x/y control while the authored world guides the orb through depth.

Possible uses:

- Low path goes behind or around a column.
- High path comes forward to collect a foreground item.
- Corridors pull the orb deeper into murk.
- Hazards or pickups occupy foreground/background lanes.
- Orb lighting changes naturally because the point light actually moves in z.
- Occlusion becomes meaningful through real depth testing.

Potential authoring primitives:

- Constant-z regions.
- Gradient z regions.
- Path strips/lanes with falloff.
- Grayscale z maps.
- Spline lanes with radius and easing.
- Z attractor points.
- Priority rules for overlapping regions.

This should remain separate from both `bounds` and `depth`:

- `depth geometry` = visible forms.
- `bounds collision` = where the orb can move.
- `orb z field` = where the orb should live in depth for a given x/y.

## Near-Term Slice Plan

1. Treat the 3D orb as the primary visual truth.
   Keep the 2D orb only as a temporary debug/ghost overlay.

2. Add debug instrumentation before changing collision again.
   Show the 3D orb center/radius, 2D collision center/radius, nearest boundary point, and contact normal so alignment problems are observable.

3. Formalize a 3D cavity collision representation.
   Start with bounds segments extruded through depth into wall/floor/ceiling side surfaces.

4. Resolve sphere-vs-extruded-boundary collision.
   Use the orb center `(x, y, z)` and radius `0.5 BO`. Keep the current 2D collision only as fallback/debug while validating.

5. Remove 2D orb dependency from player-facing staging once 3D collision is trustworthy.

6. Move depth/lighting/material code out of staging-specific prototypes into first-class runtime modules.

7. Later, add authored orb z lanes or z fields as a separate authoring source.
