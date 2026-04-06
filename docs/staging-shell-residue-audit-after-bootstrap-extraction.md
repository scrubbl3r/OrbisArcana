# Staging Shell Residue Audit After Bootstrap Extraction

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Reassess what still meaningfully lives in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

after extracting:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/receiver-host-runtime-bootstrap.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/receiver-host-impulse-adapter.js`

## Current File Shape

Line counts:

- `create-staging-shell-runtime.js`: ~2229 lines
- `receiver-host-runtime-bootstrap.js`: ~352 lines
- `receiver-host-impulse-adapter.js`: ~97 lines

This means real extraction has happened, but `create-staging-shell-runtime.js` is still large because it still owns several distinct shell domains.

## Main Remaining Domains In `create-staging-shell-runtime.js`

### 1. Shell-stage runtime and visuals

This is still a major chunk of the file and appears legitimate shell-owned code:

- stage initial state
- stage geometry helpers
- orb transform/ground line helpers
- stage runtime tick
- stars/terrain backdrop rendering
- shell stage control bindings
- stage reset/resize actions

Examples:

- `buildShellStageInitialState(...)`
- `initializeShellStageRuntime(...)`
- `tickShellStageRuntime(...)`
- `ensureShellStageBackdrop(...)`
- `drawShellStars(...)`
- `drawShellBackdrop(...)`

This does **not** look like generic receiver bootstrap.
It looks like true `game-staging` / shell-stage ownership.

### 2. Shell-local visual/effect hooks

Still shell-specific and probably valid where they are for now:

- direction/shake lamp flash helpers
- shell float-grace helpers
- shell teleport-to-spawn helper
- shell VFX boot
- shell bubble shield / colorize application

Examples:

- `flashShellDirectionLampPair(...)`
- `flashShellShakeLamp(...)`
- `shellGrantFloatGrace(...)`
- `initShellReceiverVfxRuntime(...)`
- `shellActivateBubbleShield(...)`
- `shellApplyColorize(...)`

This is a coherent shell integration layer, not random residue.

### 3. KWS boot/runtime assembly

This is still one of the biggest remaining mixed domains.

`initShellKwsRuntime(...)` still combines:

- KWS provider bootstrap
- KWS panel/runtime/controller bootstrap
- listen-policy bootstrap
- receiver bridge setup
- wake-window bridge setup
- trace logging setup
- shell spell action/runtime wiring

This is probably the biggest remaining extraction candidate.

It mixes:

- reusable KWS runtime boot
- shell-specific gameplay/VFX wiring
- dev-surface panel coupling

### 4. Pairing / calibration / mobile impulse boot

`initShellPairingRuntime(...)` still owns:

- UI overlay system boot
- mobile impulse runtime boot
- LAN session boot
- QR launch choreography
- calibration trigger wiring

This is still a meaningful host bootstrap seam and a likely future extraction candidate.

### 5. Top-level host composition

`createStagingShellRuntime(...)` now looks much more like real host composition:

- mount dev/game surfaces
- load shared modules
- create shell context
- boot KWS
- boot local stage runtime
- boot receiver host runtime
- boot pairing
- expose shell context

This is closer to where we want to be.

## What Has Improved

The file is no longer carrying the full receiver-host lane inline.

That’s important.

The extracted pieces now give `create-staging-shell-runtime.js` a much clearer role:

- shell host composition
- shell stage/runtime ownership
- shell KWS/pairing integration

So even though the file is still large, it is less architecturally confused than before.

## What Still Looks Like Real Residue

### A. Shell receiver config policy

`createShellReceiverConfigs()` still looks like duplicated policy/config residue.

Notably:

- `ENERGY_BANK_CAP`
- `ENERGY_SHAKE_COST`
- `ENERGY_CHARGE_RATE_PPS`

Those names are legacy-shaped and do not reflect current design direction.

This is a good cleanup target later, but not necessarily the highest-value next move.

### B. KWS/dev-surface bridge inside shell boot

KWS boot still directly constructs panel elements and dev-surface couplings.

This is likely the biggest remaining mixed-responsibility residue in the file.

### C. Pairing orchestration embedded directly in shell file

Pairing is still host-appropriate, but the direct embedded implementation is still a likely future extraction seam if we want a thinner host composer.

## Recommendation

At this point, there are two realistic next directions.

### Option 1: Extract pairing bootstrap next

Pros:

- continues the host-bootstrap cleanup lane
- keeps momentum on making `staging-shell` the primary host
- pairing/calibration is a clean host seam

Cons:

- KWS remains the densest mixed domain

### Option 2: Extract/classify KWS boot next

Pros:

- targets the biggest remaining mixed responsibility
- likely the highest-value architectural cleanup now

Cons:

- KWS is denser and riskier than pairing
- likely needs more care and more decisions

## Best Recommendation

I recommend **Option 1 first**:

- extract pairing/bootstrap next

Reason:

- it continues the same host-bootstrap cleanup pattern
- it is lower risk than immediately entering the KWS knot
- it gets us closer to a thin host composer faster

After that, the next major phase should probably be a deliberate KWS boot/runtime breakup.

## Decision Guidance

You do **not** need to decide whether the remaining shell-stage code should move right now.

From a design standpoint, that stage/runtime visual code looks legitimately shell-owned.

The real decisions now are:

1. pairing extraction next, or KWS extraction next
2. whether shell receiver configs should be cleaned up opportunistically, or deferred

Recommended answers:

1. pairing next
2. config cleanup later
