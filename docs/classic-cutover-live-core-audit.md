# Classic Cutover Live Core Audit

This document records which old receiver/transmitter core responsibilities are still live after the classic lower-layer cutover, and which ones are already dead or bypassed.

The goal is to choose the next retirement slice from real surviving responsibilities instead of guessing.

## Current State

Classic now owns the preferred lower-layer path for:

- receiver calibration session
- receiver signal processing
- receiver motion publication
- receiver HUD meters
- receiver orb runtime scalars
- receiver relay/bootstrap transport
- receiver host pairing and fast path
- mobile relay/bootstrap transport
- mobile join-side fast path

The root pages are still the active harness:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.html`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.html`

## Receiver: Still-Live Legacy Core Responsibilities

These are still meaningfully active in `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js` and should be treated as live until deliberately retired.

### 1. Input frame orchestration side effects

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/game-runtime/input/input-frame-pipeline.js`

Still active for:

- energy bank updates via `updateEnergyBankFromPhone(...)`
- energy bank point/cap reads via `getEnergyBankPts()` and `getEnergyBankCap()`
- receiver background energy visuals via `setBgFromEnergy(...)`
- receiver audio response via `setAudio(...)`
- shake chain side effects via `processShakeDoubleBang(...)`
- stability / variability gating via `inputDynamicsSystem`
- directional shake / flat-spin side effects via `inputGestureSystem`

Important note:

- classic already replaced HUD meter shaping and orb scalar patching
- but this pipeline still owns meaningful side effects

### 2. Receiver energy-bank/resource coupling

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`
- `resourcesSystem` integration inside MVP runtime boot

Still active for:

- live energy bank accumulation
- energy points / cap used by the root harness UI and gameplay side effects

Why it matters:

- classic `MotionStore` currently mirrors energy state for HUD/orb scalar use
- but the old resource system is still the live source of energy-bank side effects

### 3. Receiver gesture/stability systems

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`
- input systems loaded from staging/runtime bootstrap

Still active for:

- shake trigger gating
- shake cooldown logic
- directional lamp / direction side effects
- stability/variability lamps and gating
- flat-spin interpretation side effects

Why it matters:

- these are not just display residue
- they still affect behavior

### 4. Receiver debug/readout formatting

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`

Still active for:

- last-message log text
- raw payload debug text
- shield/axis debug strings

This is not lower-layer truth, but it is still live harness behavior.

## Receiver: Already Retired Or Bypassed Legacy Responsibilities

These are no longer authoritative once classic is active.

### 1. Legacy HUD view-model shaping

Status:

- bypassed when classic `MotionStore` is available

Relevant slices:

- HUD now renders from classic store snapshot
- legacy HUD model building is skipped once classic data exists

### 2. Legacy orb scalar patching

Status:

- bypassed when classic `MotionStore` is active

No longer authoritative for:

- `lift01`
- `energy01`
- `dynamics01`

### 3. Legacy HUD-only color shaping

Status:

- bypassed when classic is active

Field:

- `shieldRgb01`

This was only legacy HUD residue, not true gameplay ownership.

## Transmitter: Still-Live Legacy Core Responsibilities

These are still meaningfully active in `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`.

### 1. Mobile sensor capture and motion derivation

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

Still active for:

- raw device motion/orientation capture
- gravity basis and calibration basis derivation
- groove/smooth/speed/dynamics/shake derivation
- shake-hit generation
- directional shake classification
- payload throttling / signature gating

This is still a major live legacy core area.

### 2. Mobile calibration math

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

Still active for:

- calibration sampling
- calibration basis creation
- `calib` acknowledgment flag emission

The receiver-side calibration session is classic, but the phone-side calibration math is still legacy.

### 3. Mobile presentation side effects

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

Still active for:

- phone background energy color via `setBgFromEnergy(...)`
- phone audio via `setAudio(...)`

These are mobile harness concerns, not lower-layer transport.

### 4. Legacy spin payload residue

Path:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

Still active for:

- `shieldRGB`
- `shieldAxis`

These are still emitted into payloads and remain old compatibility baggage.

## Transmitter: Already Cut Over

These transport seams now prefer classic modules:

- relay/bootstrap transport via `transmitter-relay.js`
- mobile join-side fast path via `createFastPathJoinTransport(...)`

Important nuance:

- the mobile page is still the harness
- lower-layer transport is preferred classic
- motion derivation is still legacy

## Best Next Retirement Targets

These are the highest-value candidates after this audit.

### Candidate A: receiver energy-bank coupling

Why:

- it is still old-core truth feeding visible/gameplay side effects
- classic already has overlapping energy state
- retiring this would remove a meaningful lower-layer dependency

Risk:

- medium
- touches gameplay/audio/background behavior

### Candidate B: receiver gesture/stability side effects

Why:

- this is a substantial remaining old-core responsibility

Risk:

- high
- behavior-sensitive

This should not be the next slice unless we want a bigger seam move.

### Candidate C: mobile legacy spin payload residue

Why:

- `shieldRGB` and `shieldAxis` are known old baggage
- behavior is understandable
- likely removable with a contained compatibility review

Risk:

- medium
- could affect old spin/colorize behavior

### Candidate D: mobile signal derivation extraction

Why:

- it is the largest remaining true old core on the transmitter side

Risk:

- high
- this is a future subsystem extraction, not the next tiny slice

## Recommendation

The next slice should probably target receiver energy-bank coupling, because:

- it is still real old-core ownership
- it is lower-layer, not just UI residue
- it is smaller and safer than a full gesture-system retirement

After that, the likely next strategic move is to decide whether we want:

- one more receiver-side retirement slice
- or to start the first transmitter-side core extraction beyond transport
