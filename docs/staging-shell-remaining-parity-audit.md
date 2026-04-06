# Staging Shell Remaining Parity Audit

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Take a short, practical read on what parity gaps are still left in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/staging-shell.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

compared with the old root receiver harness.

This is not a full architecture audit.
It is a promotion-readiness audit.

## Current Shell State

The shell is no longer broadly broken.

Confirmed working or effectively at parity:

- shell boot
- pairing / calibration flow
- dev surface mount
- game surface mount
- KWS runtime
- `WORDS` / `LOG`
- shake mechanics
- shake lamp visibility
- directional lamp visibility
- meter updates
- spin mechanics
- spin wake-window behavior
- spin orb colors
- `aoe_flame`
- `sanctum`
- `aoe_electric` visual parity
- gravity / fall-drag UI contract now aligned with root receiver

That means the shell is now functionally real, not just structurally bootable.

## Remaining Parity Gaps

### 1. Orb death / crack / shatter parity

Current report:

- no visible orb cracking
- no visible death mechanic parity

What we already fixed:

- shell death hooks are no longer no-ops
- shell has real death overlay helpers
- shell has a real orb shatter controller
- shell now has crack/shard CSS that matches root more closely

What that implies:

- this is no longer a shallow shell styling gap
- the remaining problem is likely in the deeper damage/death chain:
  - event timing
  - damage visual runtime state
  - shatter trigger path
  - shell/runtime integration order

Priority:

- medium-high for full gameplay parity
- not the best quick-win next slice

### 2. Globe behavior parity

Earlier shell smoke reported:

- globe behavior did not work correctly

Current confidence:

- unresolved / not recently re-smoked after the latest shell fixes

Why it matters:

- globe behavior is a real gameplay loop concern
- unlike old browser tone or background glow, this is not cosmetic residue

Risk:

- if globe pickup / spawn / reset behavior is off, shell is still missing a real gameplay parity seam

Priority:

- high

### 3. Death-adjacent cleanup parity

Even if the crack visuals are missing because of deeper runtime issues, the full shell death cycle still needs to be validated as a bundle:

- orb death trigger
- orb shatter / crack state
- death overlay timing
- `TRY AGAIN`
- revive cleanup
- post-revive reset

This is partly grouped with orb death, but it is worth naming separately because some of it may work even if cracks do not.

Priority:

- high

## What No Longer Looks Like A Priority Gap

These looked shaky earlier but now appear good enough:

- shell boot visibility
- KWS bootstrap
- meter liveliness
- lamp styling
- electric AOE clipping
- spin wake/color parity
- shell stage control defaults

So these should not be the next focus.

## Recommendation

Do not keep digging blindly into orb death right this second.

The best next move is:

1. run one focused shell gameplay parity pass on:
   - globe behavior
   - death / revive behavior
2. use that to decide whether the real next slice is:
   - `world/globe parity`
   - or `orb death runtime parity`

Why this is the best choice:

- both remaining gaps are gameplay-facing
- both are more important than more shell UI cleanup
- and orb death is now deep enough that it should only stay top priority if it is the larger blocker

## Best Guess Right Now

If I had to pick the most likely next high-value target before another smoke:

- globe / world behavior parity

Reason:

- globe behavior is still less explored than death
- death has already consumed several slices and is now clearly deeper/runtime-shaped
- globe parity may reveal a broader world/runtime seam that also explains part of the death/reset behavior

## Recommendation To User

The most sensible next step is:

- pause isolated orb-death digging
- do one focused shell parity check on globe + death/revive as a pair
- then pick whichever of those two domains is the clearer blocker

So: yes, setting orb death aside for the moment is a reasonable call.
It does not mean the work was wasted.
It means the remaining shell parity gaps are now better handled by ranking, not by tunnel vision.
