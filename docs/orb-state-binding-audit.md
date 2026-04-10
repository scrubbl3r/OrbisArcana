# Orb State Binding Audit

## Main conclusion

Orb mechanics are already in better shape than the VFX lab was:

- core orb state lives in `src/state/orb-state.js`
- orb gameplay mechanics live in `src/game-runtime/orb/orb-system.js`
- orb-specific visual runtimes already exist in `src/game-runtime/orb/`
- orb-facing VFX identity already exists in `src/content/vfx/effect-registry.js`

What is missing is the **content/binding layer** for orb states.

Today we have:

- spell/word VFX bindings:
  - `src/content/vfx/spell-effect-bindings.js`
- no parallel orb-state VFX binding file
- no authoring workflow for:
  - pick orb state
  - pick effect/preset
  - publish binding

So the next missing lane is not orb mechanics refactoring first.

It is:

- add a first-class orb-state VFX binding schema
- then wire orb-state transitions to consume those bindings

## What already exists

### Orb mechanics

These are already separated in sane places:

- state shape:
  - `src/state/orb-state.js`
- gameplay damage/heal/death/revive:
  - `src/game-runtime/orb/orb-system.js`
- runtime motion/state shell:
  - `src/game-runtime/orb/orb-runtime-state.js`
  - `src/game-runtime/orb/orb-runtime-pipeline.js`
  - `src/game-runtime/orb/orb-runtime-loop.js`

### Orb visuals

These are also already broken into real domains:

- base orb appearance / CSS vars:
  - `src/game-runtime/orb/orb-base-state.js`
  - `src/game-runtime/orb/orb-color-runtime.js`
- damage / crack / shatter reveal:
  - `src/game-runtime/orb/orb-damage-visuals-runtime.js`
- orb shatter runtime:
  - `src/game-runtime/orb/orb-shatter-runtime.js`
  - `src/vfx/effects/orb-shatter-runtime.js`
- globe orbit / collection / release visuals:
  - `src/game-runtime/orb/orb-globes-runtime.js`

### Orb-related content signals

The repo already knows about orb-state style signal ids:

- `orb_state.charged`
- `orb_state.globe_loaded`

Those live in:

- `src/content/spell-rules/signal-definitions.js`

And the rule/event side already knows about orb event runtime routing:

- `src/content/spell-rules/event-runtime-bindings.js`

So the conceptual lane already exists.
It just does not yet have VFX bindings parallel to the spell bindings.

## What is missing

### 1. Orb-state VFX binding schema

We need the orb equivalent of:

- `src/content/vfx/spell-effect-bindings.js`

Recommended new file:

- `src/content/vfx/orb-state-effect-bindings.js`

Recommended entry shape:

```js
Object.freeze({
  orbStateId: "charged",
  primary: Object.freeze({
    effectId: "orb.some_effect",
    presetId: "preset.orb_some_effect.default",
  }),
})
```

Possible optional future fields:

- `onEnter`
- `onExit`
- `whileActive`

But for the first slice, keep it simple:

- one primary visual binding per orb state

### 2. Resolver bridge

Parallel to:

- `src/vfx/resolve-spell-vfx-binding.js`

Recommended new file:

- `src/vfx/resolve-orb-state-vfx-binding.js`

This should be read-only and lab/runtime friendly, exactly like the word resolver.

### 3. Lab authoring lane

The VFX Studio now supports runtime-word binding publish.

We need a parallel orb-state binding lane:

- target selector:
  - runtime word
  - orb state
- orb-state option list should come from a canonical source

Recommended first orb-state source:

- derive from the existing known orb-state ids already present in content

At minimum:

- `pristine`
- `crack_1`
- `crack_2`
- `shattered`
- `charged`
- `globe_loaded`

### 4. Runtime consumption path

Right now `orb-system.js` computes and emits:

- visual state changes from health
- death / revive events

But it does not resolve a VFX binding through a canonical orb-state schema.

We need a small receiver/runtime consumption layer that:

- listens for orb visual/state transitions
- resolves orb-state VFX bindings
- triggers the effect runtime or orb-local visual system accordingly

That should be a thin binding-consumption lane, not a rewrite of orb mechanics.

## Recommended architecture

Keep these layers separate:

### Orb mechanics

- health
- damage
- revive
- status transitions
- globe economy / load / consume

Live in:

- `src/state/orb-state.js`
- `src/game-runtime/orb/`

### Orb visuals

- crack reveal
- shatter
- color / shell
- future charged / overloaded / loaded visuals

Live in:

- `src/game-runtime/orb/`
- `src/vfx/effects/` for reusable runtime effect implementations

### Orb-state bindings

- which orb state uses which effect/preset

Live in:

- `src/content/vfx/orb-state-effect-bindings.js`

### Lab authoring

- choose effect
- tune preset
- bind to orb state

Lives in:

- `labs/vfx/`

## Recommendation on modularity

Do **not** force every orb concern into one mega “orb state package.”

Better separation is:

- health/life/death mechanics:
  - orb gameplay system
- crack/shatter visuals:
  - orb damage visuals runtime
- globe collection/consumption visuals:
  - orb globes runtime
- orb-state-to-VFX mapping:
  - content binding file

That is cleaner and more futureproof than giant blobs.

## Best next slice

1. add `src/content/vfx/orb-state-effect-bindings.js`
2. add `src/vfx/resolve-orb-state-vfx-binding.js`
3. add an orb-state target lane to VFX Studio bind UI
4. keep the first schema tiny:
   - `pristine`
   - `crack_1`
   - `crack_2`
   - `shattered`
   - `charged`
   - `globe_loaded`

That gives us the minimum viable orb-state workflow without reopening the orb runtime itself yet.
