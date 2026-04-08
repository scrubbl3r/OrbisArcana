# Transmitter Post-Extraction Audit

Date: 2026-04-07

## Summary

The transmitter migration has now crossed a major threshold.

What used to be a root-level phone app monolith is no longer mostly:

- page ownership
- lifecycle
- session/bootstrap
- gesture-lab structure
- browser input shell
- packet publish shell

Those have been moved into `src/runtime-shell/transmitter/`.

What remains in `mobile-transmitter.js` is now much closer to the true transmitter core.

## What Now Lives In The Transmitter Domain

The transmitter domain now owns:

- entry page
- entry bootstrap
- page shell
- lifecycle
- session/bootstrap
- motion input shell
- packet publisher
- gesture-lab state
- gesture-lab UI
- gesture-lab template logic
- gesture-lab calibration logic

That is a real architecture now, not migration scaffolding.

## What Still Lives In `mobile-transmitter.js`

### 1. Live Derivation Core

This is now the dominant remaining domain.

Responsibilities:

- orientation-to-runtime state handoff
- spin-vector derivation
- speed filtering
- lock/groove detection
- smoothness scoring
- dynamics diversity accumulation
- energy earn/decay
- shake meter/hit derivation
- orchestration of those systems inside `onMotion(...)`

Representative seams:

- `updateSpinVectorState(...)`
- `updateSpeedV0(...)`
- `updateShake(...)`
- `autocorrPeak(...)`
- `dynamicsBufPush(...)`
- `dynamicsDiversityLastSec(...)`
- `meterHoldOrFade(...)`
- `flushHistorySoft(...)`
- `onMotion(...)`

### 2. Thin Gesture/Calibration Runtime Orchestration

This still remains, but it is no longer a large domain.

Responsibilities:

- feeding live samples into gesture-lab state
- feeding calibration samples during active calibration
- triggering:
  - `updateGravityLocking(...)`
  - `finishCalibration()`
  - `recognizeGestureFromRecentBuffer(...)`
  - `classifyDirectionalShake(...)`

This is now mostly orchestration around already-extracted state/UI/math.

### 3. Audio Runtime Helpers

This is a distinct small seam:

- `ensureAudio()`
- `setAudio(...)`

It is separate enough to notice, but not obviously the highest-priority extraction.

### 4. Start/Stop Runtime Reset Body

The lifecycle host state is extracted, but the runtime reset body still lives inline:

- reset of motion-derived state variables
- audio reset
- listener attach/detach handoff
- calibration pending handoff

This is no longer host ownership; it is runtime reset ownership.

## Most Important Conclusion

The remaining root-level transmitter code is now mostly real behavior core, not broad shell sprawl.

That changes the standard.

We should not keep extracting just because a file is still large.

Now each next cut should be justified by one of these:

- it creates a stable permanent runtime domain
- it materially reduces risk or confusion
- it avoids keeping a fake host boundary inside the monolith

## Recommendation

Best next options are now:

1. stop and accept `mobile-transmitter.js` as the temporary authoritative motion core
2. take one more bounded runtime-family extraction

If taking one more extraction, my recommendation is:

- extract the audio/runtime reset helper family

Why:

- smaller risk than touching the derivation core
- cleaner permanent boundary than arbitrary micro-splitting
- leaves the remaining monolith even more honestly “motion derivation core”

What I do **not** recommend next:

- full `onMotion(...)` extraction
- aggressive splitting of the derivation math without a stronger reason

## Bottom Line

Receiver is effectively cut over.

Transmitter is now very close:

- shell and app structure are in the right place
- the old root-level phone file is no longer mostly app-shell code
- what remains is largely the true derivation/runtime core

That means we are near a sensible pause point unless we specifically want one more bounded runtime-family extraction before declaring the remaining motion core temporarily authoritative.
