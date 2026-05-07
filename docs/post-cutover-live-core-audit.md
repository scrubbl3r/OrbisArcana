# Post-Cutover Live Core Audit

This audit captures what still appears meaningfully legacy after the classic cutover work, including:

- canonical receiver motion processing
- canonical spin SSOT
- `energyBank` sunset
- receiver audio/background sunset

This is not a full repo audit. It is a live-runtime ownership map for deciding the next cleanup slice.

## What Classic Now Owns

These areas are now on the classic lower-layer path or its published `MotionStore` output:

- receiver motion normalization and publication
  - `src/runtime-shell/receiver/signal-processor.js`
  - `src/runtime-shell/receiver/motion-store.js`
- calibration session
- receiver relay/bootstrap transport
- receiver host pairing / fast-path preference
- mobile relay/bootstrap transport
- mobile fast-path join preference
- HUD meter truth in the root receiver
- orb runtime scalar truth for lift / dynamics
- canonical spin truth end-to-end
  - phone derives `spinVector` / `spinDirection`
  - receiver publishes interpreted spin state
- energy signal as canonical motion value
  - raw `energy01`
  - no more `energyBank`

## What Is No Longer A Meaningful Legacy Concern

These old seams are effectively retired:

- shield-spin payloads
  - `shieldRGB`
  - `shieldAxis`
- receiver laptop/browser tone
- receiver background glow
- receiver `energyBank`
- shake-cost energy gating
  - `canSpendShake()`
  - `spendShake()`

## Remaining Meaningful Legacy Seams

### 1. Receiver-side stability / variability orchestration

The biggest remaining old-core seam on the receiver side is the input-frame side-effect lane around:

- `setStabilityVisualGate(...)`
- `applyStabilityVisuals()`
- `inputDynamicsSystem.processFrame(...)`
- `inputGestureSystem.processFlatSpinFrame(...)`
- `processShakeDoubleBang(...)`

Current path:

- `game-receiver.js` builds frame values
- `src/game-runtime/input/input-frame-pipeline.js` orchestrates these side effects
- receiver/staging host code still owns some visual and lamp consequences

This is still active and still important, but it is no longer blocked by energy or spin cleanup.

### 2. Staging-shell duplication / host orchestration sediment

`staging-shell` still contains a parallel host path that mirrors the root receiver harness in places, especially around:

- `runInputFramePipeline(...)`
- dev-staging HUD rendering
- stability visual gate / visuals
- receiver host runtime wiring

This is not a motion-core truth problem anymore.
It is now a host/surface organization problem.

### 3. Mobile-side derivation organization

`mobile-transmitter.js` still owns a large amount of derivation and app-shell logic in one place:

- raw sensor intake
- calibration/orientation-aware derivation
- groove/smooth/speed/dynamics/energy derivation
- canonical spin derivation
- relay/direct transport behavior
- page UI behavior

This is no longer “wrong,” but it is still dense.
The next cleanup there is likely organizational, not conceptual.

### 4. Resources system is now mostly globe inventory

After the `energyBank` sunset, `resources-system` is no longer an energy resource authority.

What remains valid:

- stored globe inventory
- pickup bookkeeping
- globe spend events

What looks like cleanup residue:

- staging bootstrap no longer passes legacy energy config fields into `createResourcesSystem(...)`
- the system still travels through runtime context under the old broader “resources” framing

This is now low-risk cleanup, not a live behavior problem.

## Remaining Compatibility Residue

These are still around, but they look more like cleanup polish than major architecture blockers:

- `shieldRgb01` in legacy HUD/pipeline return shaping
  - mostly inert / compatibility-oriented
- `energyUI01` naming
  - now just raw normalized energy, not bank UI
- legacy HUD view-model builder removed from the active bootstrap path
- staging bootstrap no longer accepts the old energy config constants

## Recommended Next Targets

### Best next implementation slice

Receiver-side stability / variability side-effect cleanup.

Why:

- still live
- still receiver-local
- not entangled with transport
- not blocked on shake sensing changes

Important constraint:

- do not change shake detection/filtering semantics while doing this

### Best next organizational slice after that

Staging-shell / root receiver spaghetti classification.

That should sort remaining host responsibilities into buckets like:

- shell orchestration
- dev-staging UI
- game-staging UI
- debug/log surfaces
- mobile page assets
- leftover garbage

## Bottom Line

The hard lower-layer rescue is mostly done.

What remains is no longer:

- “save the motion core”

It is now mostly:

- clean up live side-effect orchestration
- separate host/surface spaghetti into the right domains

That is a much better place to be.
