# Root Receiver Dev-Surface Residue Audit

This audit captures what still meaningfully lives in the root receiver harness after the recent unpacking work.

It is not a motion-core audit.
It is specifically about the remaining `game-receiver.js` dev-surface and staging-host residue.

## Current Direction

What is already cleanly moved out:

- receiver-side motion truth
- calibration/session/transport lower layers
- canonical spin truth
- shared stability visual logic
- shared dev lamp visual logic
- shared dev-staging HUD renderer/reset
- shared dev-staging status/fatal/debug/popup helpers
- shared dev-staging panel projection helper
- shared legacy dev-staging adapter module

What this means:

- the root receiver is still the active harness
- but a large amount of the old surface logic has already been relocated into:
  - `src/runtime-shell/receiver/`
  - `src/runtime-shell/staging/dev-staging/`

## What Still Lives In `game-receiver.js`

### 1. Boot / orchestration glue

This is still the main remaining root-specific dev-surface responsibility.

Examples:

- choosing between:
  - mounted `dev-staging`
  - legacy fallback dev adapter
- tracking:
  - `legacyDevStagingView`
  - `currentDevStagingView`
  - `devStagingRefs`
- refresh/swap helpers:
  - `setCurrentDevStagingView(...)`
  - `refreshLegacyDevStagingView()`
- mounted surface activation:
  - `maybeMountDevStagingSurface()`

This is harness/orchestration logic.
It does not belong in `receiver/`.
It likely belongs either:

- temporarily in the root harness while root remains the smoke target
- or later in a dedicated staging/dev-surface host bootstrap helper

### 2. Inline fallback dev adapter residue

The inline fallback is much smaller now, but it still exists.

Current pieces:

- `createBootFallbackDevStagingRefs()`
- `createInlineBootFallbackDevStagingAdapter(refs)`
- `createBootFallbackDevStagingAdapter()`

This residue still exists for one practical reason:

- the root receiver must keep working even before the module-loaded `dev-staging` path is available

So this is not garbage yet.
It is compatibility/harness scaffolding.

### 3. KWS / wordboard dev-surface bridge glue

This is probably the biggest remaining dev-surface-specific residue in the root harness.

Examples:

- `createDevStagingPanelElements()`
- `bootstrapKwsStaging(...)` inputs
- phone log routing through `kwsPanelController`
- wordboard/log popup wiring
- KWS readout/tuning UI bridge code

Important distinction:

- some KWS runtime logic belongs elsewhere
- but the UI bridge from KWS runtime to dev surface is still strongly tied to the root harness

This is a real next extraction candidate.

### 4. A few small wrapper seams

These now exist mainly to reduce direct surface coupling:

- `setDevSurfaceDebugNote(...)`
- `setDevSurfaceFatal(...)`
- `setDevSurfaceStatus(...)`
- `closeTopmostDevSurfacePopup()`
- `resetDevSurfaceMeters()`
- `renderDevSurfaceHud(...)`

These are not a problem.
They are actually helpful staging points for future extraction.

## What Is No Longer The Problem

These are no longer major root-harness concerns:

- meter rendering/reset duplication
- spin debug readout formatting
- stability lamp interpretation duplication
- shake/direction lamp timer duplication
- old energy-bank UI semantics
- old laptop tone/background side effects

Those were good cleanup wins and do not need immediate attention.

## Recommended Classification

### Keep in root harness for now

- view-selection / boot orchestration
- mounted-vs-fallback switching
- temporary fallback adapter compatibility

### Move toward `dev-staging/`

- KWS/wordboard/log surface projection helpers
- popup/header/body surface contract helpers
- any remaining dev-panel DOM-contract shaping

### Keep in `receiver/`

- shared receiver-side behavioral visual logic
- lamp/stability helpers
- debug readout composition when it is receiver-semantic

## Best Next Move

The highest-value next target is:

- KWS / wordboard dev-surface bridge extraction

Reason:

- it is still a large visible chunk of root dev-surface residue
- it is more domain-specific to `dev-staging` than the remaining boot glue
- it can likely be extracted without touching motion behavior

## Recommended Order

1. keep root receiver as active smoke harness
2. extract KWS/wordboard dev-surface bridge helpers toward `dev-staging/`
3. leave boot/fallback switching in root until later
4. only after that, consider whether the remaining inline fallback adapter can shrink further or be replaced entirely

## Bottom Line

The root receiver is no longer carrying the old general-purpose surface mess.

What remains is much narrower:

- boot orchestration
- fallback compatibility
- KWS/wordboard UI bridge glue

That means the next slices should stop nibbling at generic HUD/lamp cleanup and start targeting the KWS/dev-surface bridge directly.
