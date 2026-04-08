# Transmitter Residue Audit After Gesture-Lab Extraction

Date: 2026-04-07

## Summary

The transmitter migration has now reached a new phase.

Earlier, the remaining non-motion work was still dominated by host/bootstrap and gesture-lab structure.

That is no longer true.

At this point:

- entry/page ownership lives in `src/runtime-shell/transmitter/`
- lifecycle ownership lives in `src/runtime-shell/transmitter/`
- session/bootstrap ownership lives in `src/runtime-shell/transmitter/`
- gesture-lab state, UI, template logic, and calibration helper logic now live in `src/runtime-shell/transmitter/gesture-lab/`

So the remaining root-level phone monolith is now much closer to a true motion runtime than a mixed app shell.

## What Now Lives In The Transmitter Domain

Current transmitter-domain structure:

- `mobile-transmitter-entry.js`
- `transmitter-page-shell.js`
- `transmitter-ui-boot.js`
- `transmitter-viewport-boot.js`
- `transmitter-session-bootstrap.js`
- `transmitter-lifecycle.js`
- `gesture-lab/transmitter-gesture-lab-state.js`
- `gesture-lab/transmitter-gesture-lab-ui.js`
- `gesture-lab/transmitter-gesture-lab-logic.js`
- `gesture-lab/transmitter-calibration-logic.js`

This is now a coherent file architecture, not just a scattering of migration shims.

## What Still Lives In `mobile-transmitter.js`

### 1. Motion Runtime Core

This is now clearly the biggest remaining domain:

- motion permission gate
- orientation update path
- motion listener attach/detach
- shake / spin / groove / dynamics derivation
- live motion history updates
- publish cadence and packet shaping

Representative seams:

- `requestMotionPermissionIfNeeded()`
- `onOrient(...)`
- `onMotion(...)`
- `publishDynamics(...)`
- `sigChanged(...)`

### 2. Thin Calibration / Gesture Orchestration

A smaller strip of orchestration still remains in the monolith:

- `beginGravityLock()`
- `updateGravityLocking(...)`
- `beginRecording(...)`
- `endRecording()`
- `recognizeGestureFromRecentBuffer(...)`
- `startCalibration()`
- `finishCalibration()` state transitions
- `classifyDirectionalShake(...)` wrapper

But the important nuance is:

- most of the pure state/UI/math underneath those functions is already extracted
- what remains is mostly runtime coordination with live samples, `running` state, and `onMotion(...)`

So this is no longer a large standalone domain.

### 3. Final Runtime Composition Glue

What remains around start/stop is now pretty small:

- listener attach/detach
- audio/runtime reset
- calibration-start handoff after boot
- session-connect handoff into runtime start

This is increasingly just part of the motion runtime host, not its own big category.

## Most Important Conclusion

We are now very close to the first true transmitter motion-runtime extraction phase.

The next decision is no longer:

- "should we keep extracting gesture-lab pieces?"

It is now:

- "do we take one more small coordination slice first, or begin a deliberate motion-runtime extraction?"

## Recommendation

My recommendation is:

1. do one short transmitter motion-runtime classification pass next
2. use that to choose the first motion-runtime seam

Most likely first candidates:

- motion listener / permission wrapper
- publish cadence / packet shaping wrapper
- or a bounded `onMotion(...)` support seam

I do **not** recommend continuing with arbitrary small gesture-lab cuts now.

That domain is largely extracted already.

## Bottom Line

The transmitter migration is now past the bootstrap phase and past most of the gesture-lab phase.

The next honest phase is:

- motion-runtime extraction planning
