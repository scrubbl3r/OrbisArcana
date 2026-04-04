# Spin SSOT Audit

This document audits the current live spin path and proposes the canonical spin SSOT shape we should build before sunsetting `shieldRGB` / `shieldAxis`.

## Current Truth

Right now the live spin gate is still derived from legacy payload fields:

- `shieldAxis`
- `shieldRGB`

Those are produced on the phone, sent in the payload, normalized on the receiver, and then consumed by the gesture system to decide whether the current flat spin qualifies as `x`, `y`, or `z`.

That means:

- current spin behavior is live
- but the spin source is not clean SSOT yet

## Current Live Path

### 1. Mobile derivation

In:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js`

The phone currently computes:

- `shieldAxis01`
- `shieldRGB`

using:

- orientation matrix
- calibrated basis
- rotation-rate vector
- a rolling history (`shieldAxisHist`)

The main function is:

- `updateShieldAxis(nowMs, omegaUnit)`

This is legacy derived presentation-compatible spin state.

### 2. Payload transport

The transmitter still sends:

- `shieldAxis`
- `shieldRGB`

inside the motion payload, alongside the more legitimate raw-ish fields:

- `a` / `ag`
- `r` / `rr`
- `energy01`
- `groove01`
- `dynamics01`
- `smooth01`
- `speed01`
- `shake01`
- `locked`
- `hz`

### 3. Receiver normalization

In:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/game-runtime/input/input-system.js`

The receiver input system still normalizes:

- `shieldAxis`
- `shieldRGB`

into the per-frame input state.

### 4. Gesture spin decision

In:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/game-runtime/input/input-gesture-system.js`

The live flat-spin gate uses:

- `axisFromVisibleShield(raw)`

which resolves from:

- `axisFromShieldAxis(raw.shieldAxis)`
- or fallback `axisFromShieldRgb(raw.shieldRGB)`

Then `processFlatSpinFrame(...)` uses:

- dominant axis
- dominance value
- dominance gap
- hold/release timing

to open or close the live spin window.

So the current live `spin_x / spin_y / spin_z` behavior is still downstream of the old shield fields.

## Legit Existing Raw Inputs

The good news is we already transmit enough raw data to derive a clean spin signal.

Already present in payload:

- `r` / `rr` = rotation-rate vector
- `a` / `ag` = accel / accelIncludingGravity vector
- calibration state exists on the phone and is already reflected in the resulting motion stream

So we do **not** need `shieldAxis` / `shieldRGB` to remain the canonical transport truth.

Those fields are legacy derived compatibility outputs, not required raw inputs.

## Current Classic Core Readiness

In:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/receiver/signal-processor.js`
- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/receiver/motion-store.js`

The classic core already has placeholders for:

- `presentation.spinColor`
- `debug.spinAxis`

And `signal-processor.js` already accepts:

- `spinAxis`
- fallback `shieldAxis`
- `spinColor`
- fallback `shieldRGB`

That means the classic receiver core is structurally ready to carry real spin truth.

## Clean Canonical Spin Shape

Recommended canonical fields:

- `spinAxis`
  - normalized 3-vector in receiver truth space
- `spinAxisDominance`
  - strongest-axis normalized dominance value
- `spinAxisGap`
  - strongest minus second strongest component
- `spinAxisLabel`
  - `"x" | "y" | "z" | null`
- `spinDirection`
  - `"cw" | "ccw" | null`

Possible future-friendly shape:

```js
motion.spin = {
  vector: [x, y, z],
  dominance: 0,
  gap: 0,
  label: null,
  direction: null,
}
```

For now, if we want to stay conservative with the current codebase, we can begin with:

- `debug.spinAxis`
- `debug.spinAxisDominance`
- `debug.spinAxisGap`
- `debug.spinAxisLabel`
- `debug.spinDirection`

Then move them into a more formal `motion.spin` group later once consumers are switched over.

## Recommended Derivation Home

The correct place to derive canonical spin truth is:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/receiver/signal-processor.js`

Reason:

- transmitter should send raw or minimally processed motion truth
- receiver signal processing should derive motion semantics
- `MotionStore` should publish canonical spin truth
- gameplay / KWS / spell / HUD consumers should subscribe to that truth

## Proposed Derivation Strategy

### Phase 1

Use the existing rotation-rate payload:

- `rotationRate` from `packet.r`

Compute:

- absolute component magnitudes
- normalized dominance vector
- strongest-axis label
- dominance value
- gap value

This should reproduce the current legacy `x / y / z` gate behavior closely enough to test parity.

### Phase 2

Add a simple spin direction field.

Likely simplest first implementation:

- use the sign of the dominant rotation-rate component
- map sign to `"cw"` or `"ccw"` per axis convention

Important note:

- direction semantics may need per-axis sign conventions later
- but the field is still worth introducing now as future-facing canonical spin metadata

### Phase 3

Retarget the live consumer:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/game-runtime/input/input-gesture-system.js`

to prefer canonical spin truth first, and only fall back to `shieldAxis` / `shieldRGB` while parity is being tested.

## Legit Colorize Path

Colorize is already cleaner than spin gating.

The actual live colorize runtime path is:

1. interaction graph rule fires
   - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/content/interactions-v2/interaction-graph-v2.js`
2. spell/action routing executes `colorize`
3. receiver applies colorize via:
   - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/game-receiver.js`
   - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/game-runtime/orb/orb-color-runtime.js`

So:

- colorize effect is already a legit receiver-side runtime path
- spin detection is the part still depending on legacy shield fields

## Recommended Implementation Order

1. derive canonical spin fields in `signal-processor.js`
2. publish them via `motion-store.js`
3. expose them to the live receiver consumer path
4. update `input-gesture-system.js` to prefer canonical spin truth
5. verify parity for:
   - `spin_x`
   - `spin_y`
   - `spin_z`
   - colorize side effects
6. only after parity:
   - delete `shieldAxis`
   - delete `shieldRGB`

## Recommendation

This is the right time to do the spin SSOT detour.

Why:

- we already have enough raw transport input
- the classic core is ready to hold the signal
- `shieldAxis` / `shieldRGB` are the main blocker to a clean sunset

The next implementation slice should therefore be:

- canonical spin derivation in `signal-processor.js`
- canonical spin publication in `motion-store.js`
- then a narrow consumer switch for the live spin gate
