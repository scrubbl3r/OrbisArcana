# Depth Duotone Perforation Plan

Date: 2026-05-08
Branch: `05/06/26-Orbis-Arcana-3D`

## Authored Smoke Fixture

`src/content/levels/orb-hangar/orb-hangar.map.svg` now contains the first
duotone depth fixture:

- Main depth body: `B=200` (`#0000c8`) with `max=10bo`.
- Perforation/reveal body: `R=255` (`#ff0000`) inside the main depth body.

The intended interpretation is:

```text
B = main depth volume
R = back-wall perforation / reveal target

R < B  -> ignore red
R = B  -> cut a simple back-wall opening
R > B  -> cut an opening and build a reveal extrusion of R - B
```

For this fixture, `B=200` means the main cavity depth is about `7.84BO`.
`R=255` means the red opening targets `10BO`, so the reveal depth is about
`2.16BO` behind the main back wall.

## Current Parser Caveat

The red rectangle is presently labelled with the same `depth:reactor ...`
metadata as the blue source. The current SVG parser treats labelled child
depth shapes as independent depth sources, so this fixture may hydrate as a
second depth layer until the duotone parser is implemented.

The implementation pass should make red bodies inside a depth source become
operations on that source rather than independent depth volumes.

## Implementation Plan

1. Extend depth source hydration.
   Parse a depth source into blue geometry plus red operations. Preserve SVG
   stack order, layer visibility, transforms, and existing `max`, `z`,
   `material`, and `tess` metadata.

2. Preserve vector outlines for uniform channel bodies.
   Continue using vector contours for uniform blue bodies to avoid diagonal and
   curve stair-stepping. Use channel values only to scale the depth in this
   path.

3. Classify red operations against the local blue depth.
   For each red operation, compare `R` to the blue depth at that authored area:
   ignore when `R < B`, make a simple back-wall cutout when `R = B`, and make a
   reveal when `R > B`.

4. Build back-wall booleans.
   Subtract simple red openings from the blue back wall only. Do not cut the
   front opening or outer side walls.

5. Build reveal geometry.
   For `R > B`, create side walls, ceiling, and floor from the blue back plane
   to the red target plane. Leave the far face open so lower SVG stack layers or
   the default Three background can show through.

6. Keep fallback raster behavior scoped.
   Use raster sampling for nonuniform channel maps, gradients, or future
   painted fields, but keep uniform fixtures on vector geometry whenever
   possible.

7. Add contracts before broadening authoring.
   Add a fixture that asserts one blue depth source plus one red operation does
   not hydrate as two independent depth layers, and add geometry-level checks
   for simple cutout and reveal depth classification.

## Smoke Criteria

- `orb-hangar` loads with one logical depth source.
- The blue outline remains vector-clean with no visible diagonal stepping.
- The red rectangle opens only the back wall.
- With `B=200` and `R=255`, the reveal extends by about `2.16BO`.
- If no authored layer exists behind the reveal, the opening shows the default
  Three canvas/background.
