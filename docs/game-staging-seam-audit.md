# Game-Staging Seam Audit

## Intent

Identify which world-facing staging hooks currently live in `staging-shell` but belong closer to `game-staging`, and define the clean seam for future rewiring.

## Clean Seam

`staging-shell` should own:

- boot
- pairing
- dev + game surface composition
- top-level orchestration
- cross-surface shell concerns

`game-staging` should own:

- stage surface markup refs
- world-facing visual layers
- backdrop/starfield/terrain adapters
- stage-local VFX mounts
- orb visual/state presentation hooks
- game-space runtime adapter seams

## Current World-Facing Assets Already In Game-Staging

These are already physically mounted by `game-staging` and support the argument that the adapter logic should trend there too:

- `#stars`
- `#terrain`
- `#groundLine`
- `#orb`
- `#orbCracks`
- `#orbShards`
- `#shield`
- `#shockLayer`
- `#flameLayer`
- `#electricLayer`
- `#deathPanel`

Source:

- [/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/game-staging.js](/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/game-staging.js)

## Current Shell-Owned Logic That Looks Like Game-Staging Ownership

These functions are currently in:

- [/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js](/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js)

And they read as game-stage adapter logic, not shell logic:

### Backdrop / Stage Visuals

- `drawShellStars`
- `drawShellBackdrop`
- `ensureShellStageBackdrop`
- mountain/terrain profile projection from authored level content

These should move toward a `game-staging` backdrop adapter.

### Orb Stage Presentation

- `applyShellGroundLine`
- `applyShellOrbTransform`
- `renderShellOrbDamageVisuals`
- `lineToPath`
- `updateShellOrbStrokeColor`

These are all stage-local orb presentation concerns.

### Orb Shatter Integration

- `stopShellShardSim`
- `spawnShellShardFx`
- `runtime.vfx.playOrbShatter` setup
- `runtime.orbShatterController` creation

This is the strongest current example of a shell-owned game adapter seam.

### Death Overlay / Stage Death UX

- `openShellDeathOverlay`
- `closeShellDeathOverlay`
- `scheduleShellDeathOverlay`
- `clearShellDeathOverlaySchedule`

These are game-stage presentation behaviors even if the shell currently hosts the runtime.

## Transitional Shell Ownership That Is Still Acceptable

These can remain in `staging-shell` for now because they are still true composition/orchestration:

- mounting `dev-staging` and `game-staging`
- boot/pairing state machine
- shell-level module loading
- creating the top-level runtime context
- feeding refs from the mounted `game-staging` surface into the runtime

## Recommended Rewire Order

### Slice 1

Create a `game-staging` runtime adapter module for stage-local refs and world-facing visual hooks.

Suggested home:

- `src/runtime-shell/staging/game-staging/game-staging-runtime-adapter.js`

First responsibilities:

- expose stage refs in a game-owned adapter
- own starfield/terrain/orb-layer adapter functions
- accept runtime hooks from shell composition

### Slice 2

Move backdrop/starfield/terrain projection logic out of `create-staging-shell-runtime.js` into the new adapter.

### Slice 3

Move orb presentation helpers:

- orb transform
- crack rendering
- ground line application
- stroke color application

### Slice 4

Move orb shatter stage integration:

- shard spawn handoff
- shard stop/clear
- shatter controller creation

This is the key boundary-cleanup slice before more orb-state growth.

### Slice 5

Move death-panel stage presentation hooks.

## Architectural Recommendation

Do **not** move raw gameplay mechanics into `game-staging`.

Do move:

- world-facing adapters
- stage presentation glue
- stage-local VFX/runtime hookups

So the resulting shape should be:

- gameplay mechanics in runtime domains
- shell composition in `staging-shell`
- world-facing stage integration in `game-staging`

That is the clean seam this audit recommends.
