# labs

Experimental authoring space for game content before production integration.

## Workspace Boundaries

- `shell/` owns shared Lab authoring infrastructure such as workspace navigation,
  profile storage, generic publish helpers, and reusable adapter dispatch.
- `vfx-studio/` owns visual effect authoring for spells, orb visuals, and
  effect-like world visuals.
- `world-workshop/` owns world object authoring for props, spawn anchors,
  scenery pieces, generators, and object inspection previews.
- `enemy-workshop/` owns enemy archetype authoring for actor previews, behavior
  tuning, personality ranges, and future publish contracts.
- `sfx/` remains the future sound authoring lane until it becomes a first-class
  workspace.

Production runtime code must not import from `labs/`. Lab code may publish
stable values into `src/` through explicit publish contracts.

## Naming

- Use lower kebab-case for file and directory names.
- Name first-class workspaces by product role, such as `vfx-studio/` and
  `world-workshop/`.
- Keep shared authoring utilities in `shell/`; keep workspace-specific preview,
  adapter, registry, and publish code inside that workspace directory.

## Workflow

1. Prototype and tune content in the matching Lab workspace.
2. Record finalized values and behavior notes in workspace-owned files.
3. Publish stable implementations into production game systems.

## VFX Studio Contract

Run `npm run check:vfx-lab` before adding or reshaping VFX Studio entries. The
check prints the surface matrix and fails when a VFX surface is missing its
expected section, preview root, authoring adapter, live publish builder,
behavior surface, or explicit exception note.
