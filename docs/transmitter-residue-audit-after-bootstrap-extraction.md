# Transmitter Residue Audit After Bootstrap Extraction

Date: 2026-04-07

## Summary

The transmitter migration has crossed an important threshold:

- transmitter-domain code now owns page entry
- transmitter-domain code now owns page shell
- transmitter-domain code now owns UI boot
- transmitter-domain code now owns viewport boot
- transmitter-domain code now owns session/bootstrap
- transmitter-domain code now owns start/stop lifecycle state

That means `mobile-transmitter.js` is no longer acting like the phone host shell.

What remains in the root-level monolith is now mostly:

- motion runtime
- gesture lab / calibration tooling
- a thinner band of transport/gameplay handshake glue around those systems

## What Has Been Successfully Moved

These are now proper transmitter-domain seams:

- `src/runtime-shell/transmitter/mobile-transmitter.html`
- `src/runtime-shell/transmitter/mobile-transmitter-entry.js`
- `src/runtime-shell/transmitter/transmitter-page-shell.js`
- `src/runtime-shell/transmitter/transmitter-ui-boot.js`
- `src/runtime-shell/transmitter/transmitter-viewport-boot.js`
- `src/runtime-shell/transmitter/transmitter-session-bootstrap.js`
- `src/runtime-shell/transmitter/transmitter-lifecycle.js`

This is real migration, not just relabeling.

## What Still Lives In `mobile-transmitter.js`

### 1. Motion Runtime Core

This is still the main authoritative phone behavior seam:

- motion permission gate
- orientation tracking
- device-motion listener attachment
- phone-side shake / spin / groove / dynamics derivation
- packet publish cadence

Representative seams:

- `requestMotionPermissionIfNeeded()`
- `onOrient(...)`
- `onMotion(...)`
- `publishDynamics(...)`
- `sigChanged(...)`

### 2. Gesture Lab / Calibration Domain

This is now the clearest remaining extractable non-core domain:

- gesture template storage
- gravity lock
- calibration basis save/load
- record / save / test flows
- calibration lifecycle
- gesture-lab DOM event wiring

Representative seams:

- `beginGravityLock()`
- `beginRecording(...)`
- `endRecording()`
- `startCalibration()`
- `finishCalibration()`

### 3. Thin Runtime Composition Glue

A smaller but still real category remains:

- handoff from lifecycle start/stop into motion listener attach/detach
- handoff from session controls into calibration
- running-state coordination

This is much narrower than before and is no longer the dominant problem.

## Most Important Conclusion

The next best extraction is no longer another host/bootstrap slice.

That phase has already paid off.

The clearest next transmitter seam is now:

- gesture lab / calibration tooling

Why:

- it is domain-like and fairly self-contained
- it is less dangerous than extracting the motion derivation core
- it continues the migration without destabilizing live motion semantics

## Recommendation

Next real transmitter slice:

- extract gesture lab / calibration tooling into transmitter-domain modules

Do not extract next:

- `onMotion(...)`
- `publishDynamics(...)`
- send-rate / cadence logic

Those still belong to the final motion-runtime migration phase, not the next cleanup phase.
