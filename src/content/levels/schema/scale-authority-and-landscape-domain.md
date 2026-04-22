# Scale Authority And Landscape Domain

This note captures the current design canon around orb scale, level scale,
boundaries, and the emerging generative landscape domain.

## Core Split

There is a deliberate authority split between `orb` and `level`.

- `level` owns world/environment scale
- `orb` owns local expressive scale
- orb-adjacent children inherit from orb scale

In plain terms:

- the orb obeys the level's scale authority
- the orb's effects, spells, and nearby gameplay satellites obey the orb
- world pickups are orb-relative, not environment-authoritative

This means the orb is not the ruler of the whole world. It is a local sovereign
inside a larger world order.

## Scale Authority Hierarchy

Normal hierarchy:

1. `level/world context`
2. `orb local domain`
3. `orb-adjacent children`

Where these authorities apply:

- `level/world context`
  - terrain
  - boundaries
  - architecture
  - traversal spaces
  - hazards
  - environmental mass and proportion

- `orb local domain`
  - orb effects
  - spells
  - shields
  - fractures
  - nearby interaction envelope
  - world pickups and orb-economy satellites

Design law:

- level-authored elements default to level/world-relative dimensions
- orb-authored and orb-adjacent elements default to orb-relative dimensions

## World-Command Spells

Some later orb spells may command world scale or other world-context axes.

That is not an exception to the model. It is an extension of it:

- normally the orb authors local phenomena
- some spells mutate world context directly
- once world context changes, orb-relative children re-resolve under the new
  world truth

This supports future ideas such as:

- fractal scale navigation
- wonderland-style scale inversion
- antigravity flips
- antimatter or polarity-state toggles

The important rule is:

- global truth first
- local truth second

## Boundaries

`boundaries` are the first real authored level element family because they are
level-authoritative geometry.

They are not orb-relative.

The first exemplar is the authored `ground_plane` boundary:

- full bleed across the viewport
- no left/right gaps
- stroke style authored from source
- stroke RGBA is the source of truth

Current implication:

- the white ground line is the intended future collision plane
- it is a level-authored boundary primitive

## Ground Plane As Hello World

The ground plane is only the first "hello world" member of a larger collision
and spatial-truth system.

It should be understood as:

- the first boundary primitive
- not the whole world model
- not the final shape of terrain truth

Long-term, more boundary types should join it, but the ground plane is the
cleanest first exemplar because it tests authored source, normalization,
runtime interpretation, and rendering with minimal complexity.

## Terrain vs Boundary

Current state:

- the terrain silhouette/mountain generator still comes from the older terrain
  profile path
- the ground plane boundary is the new authored boundary path

This is a transitional state.

Target state:

- the boundary is the authoritative gameplay/collision line
- terrain art resolves relative to that authoritative line
- the visible landscape should not imply a different floor truth underneath

In short:

- boundary truth first
- landscape expression second

## Generative Landscape Domain

The mountain generator should mature into a reusable domain, not remain a small
one-off view helper.

This domain is more than "backdrop rendering". It is the bridge between:

- authored spatial truth
- generative landscape expression
- future depth/extrusion interpretation

The intended role of the generative landscape domain is:

1. read authoritative boundary/collision truth
2. derive visible landform structure from that truth
3. express depth, extrusion, and material character without changing collision
   law

This keeps:

- `what the world is`
  separate from
- `how the world looks`

That separation is essential.

## Die-Cast Map Vision

The eventual target is a canonical side-plane source artifact:

- color-coded
- semantically meaningful
- authorable
- inspectable
- deterministic

This "master die-cast map" should become the source for:

- collision
- boundaries
- materials
- 3D extrusion hints
- depth planes
- future traversal/interaction semantics

This means the map is not only a render input. It is authored world truth.

The visible landscape generator should align to this source rather than drift
away from it.

## Architectural Alignment

This direction aligns with the repo's stronger architectural pattern:

- `content` defines
- `game-runtime` executes
- `runtime-shell` presents

Applied to levels:

- `src/content/levels/`
  - authored source
- `src/game-runtime/level/`
  - normalized definition and runtime logic
- `src/runtime-shell/staging/`
  - level presentation and operator workflow

Applied to landscape generation:

- authored truth should stay in content
- normalization/runtime interpretation should stay in game-runtime
- shell/stages should render and inspect, not own the truth

## Current Practical Guidance

When deciding what belongs where:

- if it defines environmental truth, it belongs to level/world authority
- if it defines local orb expression, it belongs to orb authority
- if it mutates world context, it is a world-command spell
- if it skins or dramatizes authored world truth, it belongs to the generative
  landscape domain

## Near-Term Consequences

This note implies the following near-term design posture:

1. keep growing authored `elements.boundaries`
2. treat boundaries as level-authoritative geometry
3. keep terrain/landscape aligned to boundaries
4. do not let orb-relative logic leak upward into environment authority
5. grow the landscape generator into a real domain once the boundary truth is
   stable enough to support it

## Summary

The world order is:

- level sets environmental truth
- orb sets local expressive truth
- orb children inherit from orb
- some spells may mutate world truth directly
- all local systems then re-resolve inside that new world context

The landscape order is:

- boundaries define collision/spatial law
- die-cast map becomes canonical source truth
- generative landscape interprets and dramatizes that truth

This is the current canon.
