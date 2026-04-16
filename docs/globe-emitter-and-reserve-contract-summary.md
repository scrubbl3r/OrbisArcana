# Globe Emitter And Reserve Contract Summary

Date: April 15, 2026

This note captures the design conversation around globes, reserve state, binding, spending, and regenerative spawn points. It is not an implementation spec yet. It is a contract summary so the intent stays clear before code changes.

## Why This Matters

The current globe flow collapses too many moments together:

- catch
- internalize
- bind
- spend

The emerging design separates those moments so the UX has meaning:

- catch should feel like collection
- loaded should feel like held potential
- bind should feel like commitment
- spend should feel like completion

At the same time, world globes should not behave like dead static pickups. They should belong to authored spawn points with regenerative rules.

## Part 1: Reverse The Current Globe Polarity

The agreed direction is to reverse the old polarity of globe consumption.

Old feeling:

- caught globes disappear directly into the core
- binding feels less meaningful because the resource is already abstracted away

Desired feeling:

- caught globes become visible loaded orbiters
- the orb visibly wears gathered power
- binding becomes the consequential moment that mints offensive capability

### Desired Globe Lifecycle

1. `world`
   - globe exists in the world
   - free, collectible, not owned

2. `caught`
   - globe is successfully collected from the world
   - world entity is removed
   - catch context is stamped onto it

3. `loaded`
   - globe becomes an orbiting reserve around the orb
   - this is the main post-catch state
   - not yet committed to a spell/shake slot

4. `bound`
   - a loaded globe is committed into a shake/spell slot
   - this is the real offensive minting gate

5. `spent`
   - bound globe is actually consumed by gameplay
   - this is the meaningful completion signal

### SSOT Principle

`loaded` must be real gameplay state, not fake visuals.

That means:

- orbiting loaded globes are actual reserve inventory
- binding selects from real loaded globes
- spending consumes real bound globes

### Catch Imprint

When a globe is caught, it should preserve a small provenance payload.

Minimum useful payload:

- `globeId`
- `caughtAtMs`
- `spinAxis`
- `spinDirection`
- `imprintColor`

The color system should come from the spin axis/direction condition under which the globe was caught. This preserves the style of the moment.

### UX Meaning

- catch = gather
- loaded = hold reserve
- bind = commit reserve
- spend = complete the ritual

This turns the orb into a readable carrier of potential instead of a hidden resource sink.

## Part 2: Cave-Man Audit Findings

The audit found that the current codebase is still reversed relative to the desired contract.

### What Exists Today

- resources are mostly anonymous count
- stored globes are treated as core/internal particles
- bound slot globes are the things that visibly orbit
- slot loading already spends globe cost

### What That Means

Current semantic polarity is roughly:

- catch -> anonymous stored count
- stored count -> core visuals
- bind -> spend anonymous resource
- loaded slot -> visible orbit

This is backwards for the intended design.

### Main Consequence

The existing system treats bind as the resource-consumption moment instead of the commitment moment, and treats visible orbit as a slot artifact instead of reserve state.

That is the core inversion to fix later.

## Part 3: World Globes Need To Become Spawn-Point Driven

Separate from the orb reserve redesign, the world-side globe ecology needs to return to spawn points / emitters.

The key insight:

- the important primitive is not the loose globe
- the important primitive is the globe spawn point

Each spawn point should own globe production, regeneration, and rules.

## Part 4: Spawn Point One

The focused MVP world rule discussed was:

- start with one spawn point
- it emits one globe
- the globe is eatable
- after it is taken by the thief, the spawn point becomes empty
- it does **not** revive on thief death
- it revives only after the thief figures out how to properly **spend** that globe

This was an important correction in the conversation.

### Important Clarification

Not:

- catch globe
- die
- world resets

But:

- catch globe
- carry it through the orb-side reserve/load pipeline
- learn how to bind/spend it correctly
- only after meaningful spend does the emitter get permission to regenerate

This gives the spawn point memory and teaches the full ritual instead of rewarding hollow pickup behavior.

## Part 5: Spawn Point Contract

Each world globe should belong to a spawn point / emitter.

### Spawn Point Owns

- `id`
- position
- max live globes
- respawn rule
- respawn timing if needed later
- possible future tier / parent / child relationships

### Globe Owns

- `globeId`
- `spawnPointId`
- current state

Possible world-side states:

- `available`
- `consumed`
- `eligible_for_regen`
- `respawning`

For the first rule, the important one is:

- consumed globe makes the spawn point empty
- meaningful spend marks it eligible for regeneration

## Part 6: Regeneration Rule For The First Beacon

The first clear rule that emerged:

- one spawn point
- one globe
- consumed by thief
- respawn trigger is not time
- respawn trigger is not death
- respawn trigger is successful spend

Suggested rule name:

- `regenTrigger: "globe_spent"`

This means the beacon effectively says:

- I gave you one
- show me you know how to use it
- then I will grow another

## Part 7: Why This Is Strong

This creates a better world-resource loop:

- encourages completion, not hoarding
- teaches catch -> bind -> spend
- makes bind and spend meaningful
- makes the world respond to player mastery
- gives globe pickups authored level-design purpose

It also supports future breadcrumb behavior:

- spawn points can later be arranged in tiers
- parent consumption or spend can unlock child emitters
- world routes can be taught through regenerative beacon rules

## Part 8: MVP Direction Going Forward

When implementation resumes, the MVP should likely separate into two tracks:

### Orb-Side Track

- convert caught globes into real loaded orbiters
- preserve catch imprint
- make binding operate on loaded reserve
- make cast/spend consume bound globe state

### World-Side Track

- make each globe belong to a spawn point
- begin with one spawn point / one globe
- respawn only after meaningful spend

## Part 9: Final Intent

The high-level desired experience is:

- the orb visibly wears gathered power
- binding is a moment
- spending is a lesson-completion event
- the world remembers whether the player merely ate a globe or actually learned how to use it

That is the contract this conversation was moving toward.
