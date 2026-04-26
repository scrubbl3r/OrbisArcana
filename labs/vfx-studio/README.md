# VFX Studio

This workspace authors runtime-linked visual surfaces in Orbis Arcana.

## Core Contract

VFX Studio is surface-driven.

- `vfx-studio-surfaces.js`
  Declares the authoring surfaces. A surface defines its category, supported panes, preview root, adapter, live preset target, and optional behavior target.
- `vfx-studio-categories.js`
  Defines the category domain. Current canon categories are `spell`, `orb`, and `world`. `hazard`, `enemy`, and `sfx` are stubbed for future expansion.
- `vfx-studio-panes.js`
  Defines pane types. Current canon panes are `vfx` and `behavior`. `sfx` is stubbed as the next lane.

## Runtime Split

The page shell is intentionally thin. Most orchestration lives in studio modules:

- `vfx-studio-bootstrap.js`
  Assembles the Lab subsystems.
- `vfx-studio-activation.js`
  Handles surface selection, pane activation, and preview dispatch.
- `vfx-studio-preview-registry.js`
  Owns preview construction, playback, and orb-base refresh fanout.
- `vfx-studio-adapters.js`
  Owns authoring adapter construction and settings capture/apply flow.
- `vfx-studio-publish.js`
  Builds publish plans and payload descriptions.
- `vfx-studio-publish-orchestrator.js`
  Executes project-connected publish writes and runtime binding writes.
- `vfx-studio-bindings.js`
  Owns runtime binding readout and module generation.
- `vfx-studio-state.js`
  Owns effect-library and draft-profile state helpers.

## Scale Contract

Orb Base is the visual scale SSOT for the orb domain.

- Orb states and spell VFX should author geometry relative to Orb Base.
- World placement remains a separate concern from orb-relative visual scale.
- Resolved runtime px values are acceptable outputs; ratio-first authoring is the canon input shape.

## Globe Contract

Globe ownership is split on purpose:

- `World Globe`
  Owns globe visual identity and phase styling:
  - idle
  - collected
  - consumed
- `Orb Globe`
  Owns orb-side choreography only:
  - orbit distance
  - orbit speed
  - drift
  - inner bounce speed
  - inner padding

Collected and consumed globe size/style should not be re-authored in `Orb Globe`.

## Adding A New Surface

1. Add a preview module under `previews/` if the surface needs a Lab lane.
2. Add an authoring adapter under `adapters/`.
3. Register the surface in `vfx-studio-surfaces.js`.
4. Assign the correct category and panes.
5. If needed, provide a live preset target and optional behavior target.
6. Run `npm run check:vfx-lab`.
7. Smoke preview, save, publish, and bind flows as appropriate for that surface.

## Workspace Boundary

VFX Studio owns effect-like authoring only. World objects such as props, spawn
anchors, scenery pieces, room pieces, and tunnel pieces belong in
`labs/world-workshop/`.
