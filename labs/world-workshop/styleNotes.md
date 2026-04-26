# World Workshop Style Notes

This is a running note for the visual direction of Orbis Arcana world objects, spaces, terrain, and material systems. It begins with the style conversation around intimidation, feasibility, procedural art, Turbulent's luminous 3D ambience, and the facility-to-cave world shift.

## Core Problem

Orbis has a strong interaction model and a promising game concept, but the visual style needs to be beautiful, distinctive, and achievable by a small team or solo builder. The target is not asset-heavy illustration. The target is a constrained visual system that can generate a lot of atmosphere from simple rules.

The game should feel like a 2D side-scroller with dimensional 3D presence: parallax, terrain depth, simple lighting, procedural formations, and authored SVG-driven level composition.

## Style North Star

The strongest current direction is a clean diagrammatic occult/subatomic look:

- black or very dark solid forms
- white or off-white vector edge lines
- sparse luminous color events
- orb-driven light and magic
- procedural atmosphere
- simple 3D geometry viewed through a designed, graphic camera

The style should feel precise and strange, not busy. It can be spooky, technical, sacred, and subterranean, but it should stay legible.

## Constraint As Power

The visual system should rely on strong constraints instead of bespoke art production:

- SVG paths and regions define level composition.
- World Workshop defines reusable object generators.
- VFX Studio defines spells, orb states, and luminous events.
- Runtime systems turn authored 2D information into 2.5D and 3D geometry.
- Shared materials and lighting unify very different environments.

This keeps the work authorable and prevents the game from becoming dependent on a large hand-made asset library.

## Turbulent Reference

The Turbulent site is useful as an ambience reference, especially its luminous 3D scene. It is powered by a Three.js/WebGL canvas, a Draco-compressed GLTF scene, physically correct lighting, tone mapping, shader-colored orb surfaces, and GSAP timelines that animate camera position, scale, ambient light, and point light intensity.

The lesson for Orbis is not to copy that pipeline. The useful pattern is:

```text
simple 3D forms
+ orthographic or near-orthographic camera
+ procedural/limited materials
+ emissive orb surfaces
+ real small point lights
+ bloom/glow pass
+ slow parallax/camera movement
= dimensional but still authorable
```

For Orbis, this should become a smaller procedural-first material and lighting language.

## Luminous Ink Material Stack

A practical first shared material stack:

1. Dark solid faces.
2. Hand-drawn white/off-white edge lines.
3. Selective emissive orbs, runes, glyphs, and spell surfaces.
4. Real `PointLight`s attached to emissive elements.
5. Restrained bloom/glow.
6. Orthographic or carefully controlled camera projection.
7. Procedural fill texture where pure edges are not enough.

This should let objects feel dimensional without becoming fully rendered in a conventional game-art style.

## Facility And Cave Split

The world can support a major style shift if the geometry grammar changes while the visual grammar stays shared.

Facility grammar:

- rectilinear geometry
- reactor structures
- vault doors
- conduits and rails
- occult diagrams
- hard silhouettes
- measured, colder lighting
- abandoned nuclear facility meets decrepit cathedral

Cave grammar:

- spline-driven organic walls
- sprawling subterranean rooms
- stalactites
- stalagmites
- flowstone
- cave columns
- cracks, pockets, sinkholes
- warmer or deeper mineral fills

Shared visual grammar:

- dark solid masses
- drawn edge lines
- limited luminous color
- orb light affects nearby surfaces
- subtle procedural texture
- parallax and dimensional layering

The result should feel like the orb is moving from constructed occult nuclear spaces into older, stranger mineral spaces without leaving the same game.

## Cave Generation Approach

Do not start with a giant cave terrain engine. Most cave libraries are built for voxel worlds, roguelike maps, or fully 3D terrain. Orbis is mostly 2D composition with 3D depth, so the better path is a small custom generator that respects the SVG level editor.

Recommended approach:

1. SVG editor defines cave corridors, rooms, cracks, and regions.
2. The runtime samples those paths into floor and ceiling boundaries.
3. Seeded noise adds organic variation.
4. Stalactites and stalagmites are generated as grouped tapered/faceted meshes.
5. Flowstone is generated as layered ribbon or sheet meshes.
6. Cave columns can connect ceiling and floor where formations meet.
7. Shared edge and fill materials keep the cave aligned with the facility style.

The level designer composes the dungeon. Procedural systems add mineral life.

## Cave Formations

To avoid cartoon caves, formations should be:

- asymmetric
- faceted rather than smooth cones
- grouped in natural families
- slightly bent or warped by seeded noise
- varied in width, length, and taper
- attached to surfaces with collars or flowstone buildup
- lit by edge, grazing fill, and orb glow rather than broad diffuse shading

The target is mineral calligraphy, not generic cave props.

## Fill Strategy

Glowing edges alone may not make organic terrain read. Caves need some interior material information.

Use a three-level fill system:

1. Facility fill: nearly black, flat, very low texture.
2. Cave fill: dark charcoal, mineral green, umber, or blue-black with slightly stronger procedural grain.
3. Lit fill: surfaces pick up cyan, violet, amber, or spell-specific light near emissive objects.

The cave can carry more fill than the facility, but edges should remain the unifying language.

## Useful Technical Ingredients

Use ingredients rather than adopting a complete cave engine:

- Three.js `ExtrudeGeometry` for turning authored 2D silhouettes into dimensional meshes.
- Three.js `SimplexNoise` or npm `simplex-noise` for organic boundary distortion, mineral grain, and formation variation.
- `fastnoise-lite` if richer cellular, ridged, or domain-warped noise becomes useful.
- Three.js `MarchingCubes` only for experiments, magical blobs, ooze, or isolated organic forms, not the core cave pipeline yet.

## World Workshop Implications

World Workshop should become the place where world-object and terrain generators are inspected, tuned, and eventually promoted into runtime systems.

Potential early cave workshop items:

- `stalactite_cluster`
- `stalagmite_cluster`
- `flowstone_ribbon`
- `cave_wall_segment`
- `cave_column`

Likely controls:

- seed
- density
- length range
- width range
- jaggedness
- bend
- depth
- fill strength
- edge strength
- glow response

The first goal is not a complete cave system. The first goal is one convincing cave test slice that proves the material language, formation grammar, and SVG-to-geometry workflow.

## Current Preference

Keep Orbis procedural-first and SVG-authored. Build the style as a rule system. Avoid chasing asset-heavy realism. Let geometry grammars vary by zone, but keep the material, edge, glow, and camera language unified.

