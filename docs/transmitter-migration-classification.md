# Transmitter Migration Classification

Date: 2026-04-07

## Summary

The transmitter cutover is now in a different state from the receiver cutover:

- receiver host migration is effectively complete
- transmitter entry and page-shell ownership have begun moving into `src/runtime-shell/transmitter/`
- but the authoritative phone runtime still largely lives in `mobile-transmitter.js`

That means the next transmitter work should no longer be framed as generic "cleanup." It should be framed as a deliberate migration of specific domains out of the root-level phone monolith.

## Already Moved Or Clearly Moving

These seams are now meaningfully in the transmitter domain:

- entry page:
  - `src/runtime-shell/transmitter/mobile-transmitter.html`
- entry bootstrap:
  - `src/runtime-shell/transmitter/mobile-transmitter-entry.js`
- page shell ownership:
  - `src/runtime-shell/transmitter/transmitter-page-shell.js`
- UI boot ownership:
  - `src/runtime-shell/transmitter/transmitter-ui-boot.js`
- viewport boot ownership:
  - `src/runtime-shell/transmitter/transmitter-viewport-boot.js`

The old root URL:

- `mobile-transmitter.html`

is now just a compatibility entry that boots the transmitter-domain entry.

## What Still Lives In `mobile-transmitter.js`

The remaining monolith breaks down into four meaningful domains.

### 1. Host / Session Bootstrap

This is the most extractable remaining non-motion area:

- relay bootstrap
- fast-path join transport bootstrap
- LAN join / answer / ICE wiring
- join-status transitions
- auto-join from URL
- phone-started control handshake

Representative seams:

- `connectRelay()`
- `disconnectRelay()`
- `joinLanParty(...)`
- `disconnectLanPairing()`
- `connectLanSignalChannel(...)`
- `armPhoneStartedHandshake()`

### 2. Sensor / Motion Runtime

This is still the most behavior-sensitive part and should not be touched casually:

- permission gate
- orientation state
- motion listeners
- onMotion processing
- energy / groove / dynamics derivation
- spin vector derivation
- packet publish cadence

Representative seams:

- `requestMotionPermissionIfNeeded()`
- `onOrient(...)`
- `onMotion(...)`
- `publishDynamics(...)`
- `sigChanged(...)`

### 3. Gesture Lab / Calibration Tooling

This is internally coherent, but it is bigger than a simple UI shim:

- gesture bank
- gravity lock
- calibration basis
- template recording / save / reset
- live gesture test mode

Representative seams:

- `beginGravityLock()`
- `beginRecording(...)`
- `endRecording()`
- `startCalibration()`
- `finishCalibration()`
- gesture-lab DOM event wiring near the bottom of the file

### 4. Start / Stop App Lifecycle

This is a smaller but important composition seam:

- `start()`
- `stop()`
- running state
- listener attach/detach
- transport connect/disconnect handoff
- calibration-after-start behavior

## Recommended Extraction Order

### Best Next Extraction

Extract transmitter host/session bootstrap first.

Why:

- it is now the largest remaining non-motion domain
- it is already conceptually separate from sensor math
- it is the biggest reason the root phone monolith still feels like the real host

The cleanest first target inside that domain is:

- a dedicated transmitter session/bootstrap helper for:
  - relay connect/disconnect
  - LAN join/bootstrap
  - auto-join
  - control-handshake ownership

### What Not To Extract Yet

Do not start with:

- `onMotion(...)`
- `publishDynamics(...)`
- meter/send cadence tuning
- spin/shake derivation

Those are still authoritative behavior seams and should move only after the surrounding bootstrap ownership is cleaner.

### Secondary Candidate After Session Bootstrap

After host/session bootstrap, the next candidate is:

- gesture lab / calibration tooling

Reason:

- it is domain-like and self-contained
- but it is less central to cutover than session/bootstrap

## Recommendation

The next real transmitter migration slice should be:

- extract a transmitter session/bootstrap helper from `mobile-transmitter.js`

Not:

- more tiny page-shell wrappers
- and not motion-core extraction yet

That keeps the migration honest:

- page ownership has already moved
- next, host/session ownership should move
- then, later, motion/runtime extraction can happen from a cleaner foundation
