# Root Receiver Dev-Surface Residue Audit 2

This follow-up audit captures what still meaningfully lives in
`/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`
after the recent `dev-staging` modularization and KWS/dev-surface bridge
cleanup slices.

It is still not a motion-core audit.
It is specifically about the remaining root receiver dev-surface residue.

## What Has Improved Since The Prior Audit

The `dev-staging` domain is now internally shaped into real modules:

- `dev-staging-template.js`
- `dev-staging-refs.js`
- `dev-staging-api.js`
- `dev-staging-hud.js`
- `dev-staging-panel.js`
- `dev-staging-surface-state.js`

And the root harness now prefers more module-owned behavior for:

- panel projection / KWS panel subset shaping
- legacy adapter creation
- inline fallback adapter behavior once the module is available

So the root receiver is carrying less dev-surface implementation than it was.

## What Still Lives In `game-receiver.js`

### 1. Boot / orchestration glue

This is still the primary remaining root-only responsibility.

Examples:

- `createBootFallbackDevStagingRefs()`
- `createInlineBootFallbackDevStagingAdapter(refs)`
- `createBootFallbackDevStagingAdapter()`
- `legacyDevStagingView`
- `currentDevStagingView`
- `devStagingRefs`
- `setCurrentDevStagingView(...)`
- `refreshLegacyDevStagingView()`
- `maybeMountDevStagingSurface()`

This is not really `dev-staging` UI logic.
It is harness/bootstrap logic.

### 2. Inline fallback compatibility residue

Even though more of the behavior body is now module-owned, the root harness
still carries:

- the fallback refs builder
- a local fallback adapter shell
- the decision logic for:
  - module adapter
  - module inline fallback
  - local last-ditch fallback

This still exists because the root receiver must remain the active smoke
harness and must tolerate module-load failure.

### 3. KWS bootstrap wiring, but not as much dev-panel shaping

This seam is narrower now.

The root still owns:

- the call into `bootstrapKwsStaging(...)`
- overall orchestration of runtime/controller/bootstrap pieces
- the handoff of `createDevStagingPanelElements`

But the actual panel subset shaping is now more properly in `dev-staging`.

So the KWS residue is now more about bootstrap/orchestration than raw surface
projection.

### 4. Receiver-side lamp refs still touched directly in a few places

There are still some direct `devStagingRefs.*` uses in root for:

- shake lamp toggling / clearing
- direction lamp clear setup
- some stability lamp reads/writes

These are much smaller than before, and some of the timer/interpretation logic
is already extracted, but the root harness still touches the refs directly in a
few spots.

This is likely the next clean receiver/dev-surface seam if we want another
implementation slice after the audit.

## What Is No Longer The Main Problem

These are no longer the main residue categories:

- generic meter rendering/reset
- panel projection duplication
- template bulk
- mounted view API assembly
- spin readout formatting
- generic popup/status helper duplication

Those have already been moved where they belong.

## Recommended Classification

### Keep in root harness for now

- boot fallback selection
- mounted-vs-legacy surface switching
- module load / compatibility tolerance
- KWS bootstrap orchestration

### Keep moving toward `dev-staging/`

- any remaining view-shaping or panel-subset helpers
- legacy fallback adapter internals when safe

### Keep in `receiver/`

- receiver-semantic lamp/state helpers
- any remaining shared visual behavior that is not specific to the dev surface

## Best Next Move

The highest-value next move now appears to be one of two things:

1. small receiver/dev-surface lamp-ref cleanup
2. pause dev-surface unpacking and switch to another remaining domain

My read is that the root dev-surface residue is now narrow enough that another
large extraction spree is probably lower value than before.

If we keep going here, the cleanest next implementation seam is:

- reduce the remaining direct `devStagingRefs` lamp touches in root

If we pause here, we can reasonably say the big `dev-staging` breakup phase has
already succeeded.

## Bottom Line

The remaining root receiver dev-surface residue is no longer broad UI mess.

It is now mostly:

- harness boot/orchestration
- fallback compatibility
- a small amount of direct lamp-ref glue
- KWS bootstrap orchestration

That is a much better place than where we started.
