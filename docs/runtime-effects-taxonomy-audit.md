# Runtime Effects Taxonomy Audit

## Main conclusion

The runtime-effects layer is ready for a clearer domain taxonomy.

Today the effect implementations live in one flat directory:

- `src/vfx/effects/bubble-shield-runtime.js`
- `src/vfx/effects/shockwave-runtime.js`
- `src/vfx/effects/flame-aoe-runtime.js`
- `src/vfx/effects/electric-aoe-runtime.js`
- `src/vfx/effects/orb-shatter-runtime.js`

That is still workable, but the conceptual model has outgrown the flat shape.

The clean target taxonomy is:

- `src/vfx/effects/spells/`
- `src/vfx/effects/orb-states/`

And that matches the runtime-target binding model we now want:

- spell targets
- orb-state targets

## Current reality

### Current spell-facing effect runtimes

These already cluster naturally:

- `bubble-shield-runtime.js`
- `shockwave-runtime.js`
- `flame-aoe-runtime.js`
- `electric-aoe-runtime.js`

These are all better described as **spell runtime effects** than generic VFX.

### Current orb-facing effect runtimes

Right now the explicit reusable orb effect in `src/vfx/effects` is:

- `orb-shatter-runtime.js`

There are also orb-local runtime visuals outside `src/vfx/effects`:

- `src/game-runtime/orb/orb-damage-visuals-runtime.js`
- `src/game-runtime/orb/orb-color-runtime.js`
- `src/game-runtime/orb/orb-globes-runtime.js`

So orb visuals are already more domain-local, which is good.

## Why the taxonomy should change

We just clarified the intended authoring model:

- VFX Studio should author visual presets
- then bind them to existing runtime effect targets
- not to words or config triggers

So the directory structure should mirror that mental model.

That means the bind selector vocabulary, the effect registry vocabulary, and the runtime file layout should all line up.

## Recommended target layout

### Spell effects

Recommended directory:

- `src/vfx/effects/spells/`

Recommended first members:

- `src/vfx/effects/spells/bubble-shield-runtime.js`
- `src/vfx/effects/spells/shockwave-runtime.js`
- `src/vfx/effects/spells/flame-aoe-runtime.js`
- `src/vfx/effects/spells/electric-aoe-runtime.js`

### Orb-state effects

Recommended directory:

- `src/vfx/effects/orb-states/`

Recommended first member:

- `src/vfx/effects/orb-states/orb-shatter-runtime.js`

Future likely members:

- `orb-pristine-runtime.js`
- `orb-crack-1-runtime.js`
- `orb-crack-2-runtime.js`
- `orb-charged-runtime.js`
- `orb-globe-loaded-runtime.js`

Those do not all need to exist yet.
The point is to reserve the domain vocabulary now.

## Naming recommendation

Use:

- `spells`
- `orb-states`

Not:

- `cast-actions`
- `orb`

Why:

- `spell` is clearer and more stable than `cast`
- `orb-states` is more precise than generic `orb`
- those names match how the runtime targets should be presented in the lab bind UI

## Effect registry implications

The existing effect registry is already close:

- spell effect ids:
  - `spell.aoe_flame`
  - `spell.aoe_electric`
  - `spell.shield_bubble`
  - `spell.shockwave_ring`
- orb effect ids:
  - `orb.shatter_voronoi`

So the registry does **not** need a conceptual rewrite first.

What it may need later is a small nomenclature cleanup so the runtime module id and file placement line up more obviously with:

- `spells/*`
- `orb-states/*`

## Bundle implications

The current runtime bundle:

- `src/vfx/effects/vfx-runtimes-bundle.js`

is still a flat import surface.

That is fine for now.

If we migrate the directory structure, this bundle should remain as the stable import gateway while the actual files move underneath it.

That keeps the migration low-risk.

## Recommended migration order

1. keep the current flat files working
2. define the target runtime target registry for lab binding
3. add the new `spells/` and `orb-states/` directories
4. move the runtime files behind the stable bundle/import surface
5. only then update direct imports if needed

So:

- yes, change the taxonomy
- no, do not break consumers while doing it

## Best next slice

The next smallest sane move is:

1. define a canonical runtime-target registry for the lab bind menu
2. use `spell` and `orb-state` terminology there
3. keep the filesystem move as a follow-up slice

That gives us the naming model first, then the physical reorganization.
