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

## Part 10: Existing Repo Shape And Domain Audit

The repo already has the rough shape of a world/globe manager, but it is not yet the proper emitter system described above.

### Current World Runtime Seam

The main current world-side manager is:

- `src/game-runtime/world/world-system.js`

It currently owns:

- pickup runtime instances
- pickup attraction toward the orb
- collection detection
- basic pickup rendering
- reset behavior
- a simple respawn helper

That is good news. Globe pickup behavior is not purely scattered through shell code. There is already a game-runtime world seam.

### Current Level/Content Flow

The current flow is roughly:

1. level/world-item content defines pickup spawns
2. staging bootstrap normalizes those spawns
3. `createWorldSystem(...)` receives the resolved spawn list
4. `world-system.js` creates runtime pickup state from those spawns

Relevant current files:

- `src/runtime-shell/staging/game-staging/levels/level01.js`
- `src/content/world-items/default-world-items.js`
- `src/runtime-shell/staging/bootstrap-staging-runtime-context.js`
- `src/game-runtime/world/world-system.js`

This is a reasonable starting boundary, but it is still pickup-oriented rather than emitter-oriented.

### What Is Missing

Current world item spawns have basic placement information, but not true emitter identity.

They do not yet define:

- emitter identity
- emitter-owned globe instances
- regeneration policy
- per-emitter capacity
- tier/tree relationships
- rules like `regenTrigger: "globe_spent"`
- a lifecycle that connects world-side globe identity to orb-side spend identity

So today the model is closer to:

- "these pickups exist in a level"

The desired model is:

- "these globe emitters/wombs exist in a level, and each owns regenerative globe behavior"

### Old Respawn Behavior Found

There is already a primitive respawn behavior in `world-system.js`.

Current behavior:

- on `EVT_VOICE_SPELL_CAST`
- if `payload.trigger === "shake_detonation"`
- respawn inactive pickups with fade

This confirms that the repo once had a rough "spent/cast causes pickup return" idea.

However, it is too broad for the new contract:

- it respawns all inactive pickups
- it keys off any shake detonation
- it does not know which emitter produced which globe
- it does not prove that the spent globe came from that emitter
- it is global behavior, not emitter-owned behavior

This should be treated as legacy directional evidence, not the final architecture.

## Part 11: Proposed Domain Ownership

The clean architecture should separate world-side ecology from orb-side inventory.

### Content / Level Domain

Home:

- `src/content/world-items/`
- level-specific content such as `src/runtime-shell/staging/game-staging/levels/level01.js` while staging is still the exemplar level host

Responsibilities:

- author globe emitter specs
- define position
- define capacity
- define regeneration rule
- define future tier/child relationships

Eventually, content should define `globeEmitters`, not just loose `energy_globe` pickups.

### World Runtime Domain

Home:

- `src/game-runtime/world/`

Responsibilities:

- own emitter runtime state
- create emitted globe instances
- track available/consumed/respawning world-side globe state
- detect world-side collection
- emit catch events with emitter identity
- hear spend/completion events and regenerate the appropriate emitter

This is the right home for a future globe emitter manager.

### Resources / Orb Reserve Domain

Home:

- `src/game-runtime/resources/`

Responsibilities:

- own caught/loaded/bound/spent player-side globe state
- preserve `emitterId` through the orb-side lifecycle
- preserve catch imprint
- select loaded globe for binding
- spend bound globe

This domain should not own world placement or emitter regeneration.

### Orb Globe Visual Domain

Home:

- `src/game-runtime/orb/orb-globes-runtime.js`

Responsibilities:

- visualize loaded orbiters
- visualize bound orbiters
- visualize released globes on death if needed

This domain should not own world emitter rules.

### Shell / Staging Domain

Home:

- `src/runtime-shell/staging/`

Responsibilities:

- bootstrap/adapt level content into runtime systems
- provide DOM/canvas render surfaces
- wire systems together

The shell should not be the source of truth for emitter lifecycle, regeneration rules, or globe resource semantics.

## Part 12: Clean MVP Architecture

The first archetype/exemplar globe should prove the full seam without overbuilding.

### MVP Content Shape

One authored emitter:

- `id: "level01_globe_emitter_01"`
- position data
- `capacity: 1`
- `regenTrigger: "globe_spent"`

### MVP World Runtime Behavior

The emitter:

- emits one world globe
- becomes empty when that globe is caught
- does not respawn on a timer
- does not respawn on death
- waits for a matching spend event
- respawns only when the globe descended from that emitter is meaningfully spent

### MVP Orb-Side Behavior

The caught globe should carry:

- `globeId`
- `emitterId`
- `caughtAtMs`
- catch imprint data

When the globe is bound/spent, the spend event should include enough identity for the world emitter to know whether it should regenerate.

### MVP Rule

The important rule:

- catch does not regenerate
- bind does not regenerate
- successful spend regenerates the source emitter

This proves the full lifecycle:

- emitter creates globe
- thief catches globe
- orb carries globe
- thief learns to spend globe
- emitter grows another

That is the archetype.

## Part 13: First MVP Implementation Notes

The first implementation slice established the archetype seam in code.

### Content

`level01` now authors the exemplar as an emitter:

- `kind: "energy_globe_emitter"`
- `capacity: 1`
- `regenTrigger: "globe_spent"`

The fallback/default world item content follows the same shape so staging does not silently fall back to loose pickup semantics.

### World Runtime

`src/game-runtime/world/world-system.js` now treats each resolved spawn as an emitter-owned globe instance.

On collection it emits:

- `globeId`
- `emitterId`
- `type: "energy_globe"`
- position/time metadata

It no longer uses the old global "any shake detonation respawns all inactive pickups" behavior.

Instead, it listens for `energy.globe_spent` and regenerates only the matching empty emitter when:

- the event includes a matching `emitterId`
- the emitter has `regenTrigger: "globe_spent"`

### Resources Runtime

`src/game-runtime/resources/resources-system.js` now keeps real globe records internally.

It still exposes the old count view for compatibility:

- `getStoredGlobeCount()`
- inventory event `stored`

But the source of truth is now record-based:

- caught globe enters `state: "loaded"`
- bind promotes it to `state: "bound"`
- spend emits `energy.globe_spent` with `globeId` and `emitterId`

### Spell Dispatch

Slot loading now binds from loaded reserve instead of spending anonymously.

The loaded slot carries:

- `boundGlobeId`
- `emitterId`

Slot casting spends that bound globe identity.

This keeps the rule clean:

- catch does not regenerate
- bind does not regenerate
- cast/spend regenerates the source emitter

### Orb Globe Visuals

`src/game-runtime/orb/orb-globes-runtime.js` now reads active globe records from the inventory event.

Loaded and bound records render as orbiters.

Bound records receive a subtle tighter/brighter visual treatment, proving the distinction without introducing a full visual-design pass yet.

The old count-to-inner-core visualization is bypassed for this MVP path.
