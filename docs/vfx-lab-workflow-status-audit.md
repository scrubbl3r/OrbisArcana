# VFX Lab Workflow Status Audit

Date: 2026-04-09
Branch: `04/08/26-Emergence`

## Purpose

Capture the current real state of the VFX lab after restoring behavior from
`GAME-BUILD-REFACTOR-4` and fixing the broken theme import/runtime-init seam.

This audit is meant to answer:

- what is working right now
- what `Publish` really does today
- what `Bind` does today
- what remains missing from the desired end-to-end workflow
- what the safest next slice should be

## Current Baseline

The lab is currently back in a usable state.

Working now:

- effect dropdown renders and switches
- active control section changes with the selected effect
- `Play` works for the active effect
- Shield, Shockwave, Flame AOE, and Electric AOE all preview in the lab again
- shared shell/dev UI styling hook is present
- binding panel UI is present
- runtime-word selector UI is present

The critical restoration detail is:

- the lab must remain a single module-owned runtime
- no fallback preview layer
- no duplicate play-button ownership

## What `Publish` Means Today

### Preset publish

`Publish` currently works for presets.

In `labs/vfx/vfx-studio.html`:

- current UI settings are captured for the selected base effect
- a preset payload is built from those tuned values
- if the project is connected, publish prefers writing the live preset module for:
  - `bubble-shield`
  - `shockwave`
  - `flame-aoe`
  - `electric-aoe`
- if live publish is not available, it falls back to:
  - draft file write
  - or save/download

So today, `Publish` already behaves mostly like:

- "make the current tuned visual settings canonical for this effect"

That is the correct semantics.

### Binding publish

`Bind` is **not implemented yet**.

The lab has:

- binding panel UI
- runtime-word selector UI
- current binding inspection

But in `publishBinding()` the action is still just:

- locked-state guard
- placeholder alert

So:

- binding inspection is real
- binding authoring/publish is not real yet

## Current SSOT Structure

### Effect identity

SSOT:

- `src/content/vfx/effect-registry.js`

This names the effects and defines:

- effect id
- category
- runtime module id
- default preset id
- supported contexts
- publish targets

### Spell/word VFX bindings

SSOT:

- `src/content/vfx/spell-effect-bindings.js`

This currently stores:

- word id
- primary cast action binding
- effect id
- preset id
- optional post-cast action payloads

This is the correct place for runtime word/spell visual binding data.

### Runtime word metadata

SSOT:

- `src/content/spells/runtime-spells.js`

This currently stores:

- runtime word id
- slot
- intent
- cooldown
- cast action id
- optional post-cast actions

This is gameplay routing metadata, not VFX authoring data.

### Effect preview/runtime implementations

Current lab preview behavior lives in:

- `labs/vfx/vfx-studio.html`

Runtime effect implementations used elsewhere in the game live in:

- `src/vfx/effects/`

This means the lab is still partly its own runtime surface rather than a fully
shared runtime-module consumer.

That is acceptable for now, as long as it remains stable and intentional.

## Desired Workflow vs Current Workflow

### Desired workflow

1. choose or create an effect profile in the lab
2. tune it visually
3. publish the canonical preset
4. bind that effect/preset to a runtime word or future orb state
5. runtime uses that binding

### Current workflow

1. choose or create an effect profile in the lab
2. tune it visually
3. publish the preset
4. inspect current binding in the binding panel
5. manually author binding changes outside the lab

So the missing step is very clear:

- lab-side binding publish

## Edit Round-Trip Status

### Existing published presets

Round-trip is partial.

The lab can:

- load current preset defaults
- show and tune those values
- publish new canonical values

That is a usable preset round-trip.

### Existing published bindings

Round-trip is inspection-only right now.

The lab can:

- show current binding information
- select a runtime word to inspect

But it cannot yet:

- write a new binding back to `src/content/vfx/spell-effect-bindings.js`

## Orb-State Workflow Status

Orb-state binding flow does not exist yet.

Current VFX binding structure is word/spell oriented only.

There is no parallel published schema yet for:

- orb state -> effect id
- orb state -> preset id

That means new orb-state workflow should **not** be started by overloading the
current word binding schema. It should be added as a parallel authoring lane.

## Architectural Recommendation

Keep these layers separate:

- mechanics domain
- VFX preset authoring domain
- binding/content domain

That means:

- the lab should own presets and bindings
- gameplay/runtime domains should own mechanics
- spell/orb runtime should reference effect + preset through bindings

This remains the cleanest and most futureproof pattern.

## Safe Next Slice

The safest next implementation slice is:

- make `Bind` real for runtime words using the existing working lab baseline

That means:

- do not touch effect play behavior
- do not refactor preview lanes
- do not rewrite the lab runtime
- only implement writing the selected effect/preset onto
  `src/content/vfx/spell-effect-bindings.js`

## Recommended Sequence

1. finish runtime-word binding publish in the lab
2. smoke preset publish + binding publish together
3. add a parallel orb-state binding schema
4. only then build the first real new orb state through the completed workflow

## Bottom Line

The lab is now restored enough to use as a baseline.

What is real today:

- visual tuning
- effect selection
- preview play
- preset publish
- binding inspection

What is not real yet:

- binding publish
- orb-state binding authoring

That makes the next target precise:

- finish binding publish, without disturbing restored lab behavior
