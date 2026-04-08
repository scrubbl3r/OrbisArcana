# Transmitter Motion Runtime Classification

Date: 2026-04-07

## Summary

After the recent transmitter migration work, the remaining root-level phone monolith is now primarily a motion runtime.

That motion runtime is still large, but it is **not** one indivisible block.

It breaks into a few real subdomains with different extraction risk levels.

## Motion Runtime Subdomains

### 1. Permission / Listener Shell

This is the cleanest remaining seam.

Responsibilities:

- motion permission request
- listener attach/detach
- orientation event registration
- motion event registration

Representative seams:

- `requestMotionPermissionIfNeeded()`
- `addMotionListener()`
- `removeMotionListener()`
- `onOrient(...)`

Why this is a good first motion extraction:

- it is structurally separate from the math itself
- it is easier to verify than the derivation core
- it would let the monolith stop owning browser/device event plumbing directly

### 2. Packet Shaping / Publish Cadence

This is also reasonably separable, but slightly more behavior-sensitive.

Responsibilities:

- signature building
- signature change detection
- publish throttling
- packet shaping
- relay-vs-LAN publish handoff

Representative seams:

- `sigChanged(...)`
- `publishDynamics(...)`
- `SEND_HZ_RELAY`
- `SEND_HZ_LAN`
- `EPS`

Why this is tempting:

- it is coherent
- it has a clear input/output contract

Why it is not my first choice:

- this is exactly where meter feel and cadence live
- it is more likely to produce subtle behavior regressions than the listener shell

### 3. Spin / Groove / Dynamics Derivation Core

This is the main math-heavy core.

Responsibilities:

- speed filtering
- lock detection
- groove periodicity/autocorrelation
- smoothness scoring
- dynamics diversity
- energy earn/decay
- spin-vector derivation

Representative seams:

- `updateSpinVectorState(...)`
- `updateSpeedV0(...)`
- `autocorrPeak(...)`
- `dynamicsBufPush(...)`
- `dynamicsDiversityLastSec(...)`
- `meterHoldOrFade(...)`
- energy/lock logic inside `onMotion(...)`

Risk:

- high
- this is central behavior truth

This should not be the first motion extraction.

### 4. Shake / Directional Impulse Runtime

This is a narrower behavior core inside motion runtime.

Responsibilities:

- shake meter
- shake hit detection
- directional shake classification integration

Representative seams:

- `updateShake(...)`
- `classifyDirectionalShake(...)` wrapper

This could be extractable later, but it still depends heavily on live motion state.

### 5. Gesture/Calibration Runtime Orchestration

This is now much thinner than before.

Responsibilities:

- feeding live motion samples into gesture-lab state
- feeding live samples into calibration state
- triggering:
  - `updateGravityLocking(...)`
  - `finishCalibration()`
  - `recognizeGestureFromRecentBuffer(...)`

This is now mostly orchestration around already-extracted state/UI/math.

## Best First Motion Extraction

### Recommendation: Permission / Listener Shell First

Why this is the best next move:

- lowest risk
- highest structural clarity
- moves real browser/device ownership into `src/runtime-shell/transmitter/`
- does not yet force us to reshape the `onMotion(...)` behavior core

Concretely, the first motion-runtime helper should probably own:

- permission request
- listener add/remove
- listener registration with provided callbacks

Something like:

- `transmitter-motion-input.js`

or

- `transmitter-motion-runtime-shell.js`

under:

- `src/runtime-shell/transmitter/`

## What I Do Not Recommend Next

Do not start the motion-runtime phase with:

- full `onMotion(...)` extraction
- publish cadence extraction
- shake runtime extraction

Those are more behavior-sensitive and should come after the browser/input shell is separated.

## Recommendation

Next implementation slice:

- extract transmitter permission/listener shell first

Then reassess whether the second motion slice should be:

- publish cadence / packet shaping

or

- gesture/calibration runtime orchestration

My current bias for second place is:

- publish cadence / packet shaping

but only after the listener shell is out cleanly.
