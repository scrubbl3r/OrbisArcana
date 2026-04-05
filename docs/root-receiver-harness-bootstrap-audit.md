# Root Receiver Harness / Bootstrap Audit

This audit looks specifically at the remaining harness/bootstrap orchestration in
`/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`.

It is not a motion-core audit and not a generic dev-surface audit.

The question here is:

- what is still legitimately root harness/bootstrap responsibility?
- what is temporary fallback scaffolding?
- what might eventually move into a dedicated bootstrap helper?

## What The Root Harness Still Owns

### 1. Dev-surface selection and fallback bootstrap

The root receiver still owns the whole question of:

- do we use the legacy inline/fallback dev surface?
- do we use the module-provided legacy adapter?
- do we mount `dev-staging` into the future mount point?

Current seams:

- `createBootFallbackDevStagingRefs()`
- `createInlineBootFallbackDevStagingAdapter(refs)`
- `createBootFallbackDevStagingAdapter()`
- `legacyDevStagingView`
- `currentDevStagingView`
- `setCurrentDevStagingView(...)`
- `refreshLegacyDevStagingView()`
- `maybeMountDevStagingSurface()`

This is genuine harness/bootstrap logic.
It does not belong in `receiver/`, and it is not really ordinary `dev-staging`
surface logic either.

### 2. Module capability wiring

The root harness still owns the module-loading handoff for a number of optional
runtime capabilities:

- classic receiver lower-layer modules
- dev-staging modules
- receiver lamp/stability helpers
- KWS/bootstrap modules
- transport/session modules

This pattern exists because the root receiver is still the active smoke harness
and must remain boot-tolerant when a module fails to load.

So the root still owns:

- async imports
- fallback-to-null wiring
- “prefer module if available” decisions

This is also legitimate harness responsibility.

### 3. Startup choreography

The root harness still performs the overall boot sequence:

- init systems
- connect
- sync QR sizing
- launch LAN pairing flow

This is at the bottom of the file and is still very much root-page startup
orchestration, not lower-layer runtime truth.

### 4. KWS bootstrap orchestration

The root receiver still owns the orchestration call into KWS/bootstrap systems,
including:

- `bootstrapKwsStaging(...)`
- runtime/config/controller/bus handoff
- panel-element provider handoff

This is now less about panel-shape logic and more about host/bootstrap
responsibility.

## What No Longer Needs To Live Here

These have mostly already been pushed out:

- dev-surface template/refs/API/HUD/panel helpers
- lamp visual behavior bodies
- stability visual behavior bodies
- spin readout formatting
- most panel projection logic

That means the root harness is no longer the owner of broad UI behavior.

## Recommended Classification

### Keep in root harness for now

- boot sequence
- fallback selection
- mounted-vs-fallback surface switching
- boot-tolerant module wiring
- KWS/bootstrap orchestration

### Candidate future extraction

These could eventually move into a dedicated bootstrap helper if we want the
root file thinner later:

- dev-surface bootstrap selection
- module capability wiring
- KWS bootstrap handoff

Possible future home:

- `src/runtime-shell/staging/staging-shell/`
- or a new root bootstrap helper under `src/runtime-shell/`

### Do not move just for the sake of moving

At this point, much of what remains is legitimate page harness logic.

That means the question is no longer:

- “why is this still in root?”

It is now more:

- “is there enough remaining orchestration here to justify a dedicated
  bootstrap helper?”

## Bottom Line

The remaining root receiver harness/bootstrap residue is not messy in the same
way the old dev-surface residue was.

What remains is largely:

- real harness fallback logic
- real module wiring/orchestration
- real startup choreography

So this area should now be treated as an architectural decision point, not
automatic extraction work.
