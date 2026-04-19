# labs

Experimental workshop space for game effect prototyping before production integration.

## Naming

- Use lower kebab-case for file and directory names.
- Keep visual effect workshops in `labs/vfx/`.
- Keep sound effect workshops in `labs/sfx/`.

## Workflow

1. Prototype and tune effects in `labs/*`.
2. Record finalized values and behavior notes in each workshop file.
3. Port stable implementations into production game systems.

## VFX Lab Contract

Run `npm run check:vfx-lab` before adding or reshaping VFX Lab entries. The check prints the surface matrix and fails when a Lab surface is missing its expected section, preview root, authoring adapter, live publish builder, behavior surface, or explicit exception note.
