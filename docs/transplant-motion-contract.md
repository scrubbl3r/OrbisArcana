# Transplant Motion Contract

This branch now exposes a reusable motion-core contract with four distinct layers:

`TelemetryTransport -> CalibrationSession/CalibrationEngine inputs -> SignalProcessor -> MotionStore -> subscribers`

## Canonical receiver state

`MotionStore` should publish four buckets:

### `motion`

Canonical motion truth consumed by HUD/game/dev surfaces.

- `energy01`
- `groove01`
- `dynamics01`
- `smooth01`
- `speed01`
- `shake01`
- `lift01`
- `locked`
- `hz`
- `shakeHit`
- `shakeMeter01`
- `shakeDisplayValue`
- `accel`
- `rotationRate`

### `direction`

Direction-facing outputs derived from canonical packets.

- `vector`
- `yawDeg`
- `tiltDeg`
- `code`

### `presentation`

Optional visual-only outputs. These are not canonical motion truth.

- `spinColor`

### `debug`

Optional debug or instrumentation outputs. These are not canonical motion truth.

- `spinAxis`
- `calibOK`
- `omegaOK`
- `tag`

## Canonical transport packet

Preferred packet fields emitted by the transmitter:

- `energy01`
- `groove01`
- `dynamics01`
- `smooth01`
- `speed01`
- `shake01`
- `locked`
- `shakeHit`
- `hz`
- `accel`
- `rotationRate`
- `sd`
- `calib`
- `spinColor`
- `spinAxis`
- `calibOK`
- `omegaOK`
- `dbgTag`

## Compatibility status

The branch still tolerates a few legacy aliases at the processor edge so smoke behavior stays stable:

- `a` -> `accel`
- `r` -> `rotationRate`
- `shieldRGB` -> `spinColor`
- `shieldAxis` -> `spinAxis`

These aliases should be removed when the modern repo no longer depends on them.

## Subscriber rule

HUD, game, and dev tools should subscribe to `MotionStore`.

They should not:

- re-derive lift, energy-bank, or spin presentation from raw packets
- maintain parallel motion truth
- depend directly on transport payload aliases

## Classic receiver adapter split

The classic receiver now acts as an app shell around the headless core:

- `receiver-transport.js` handles room connection and packet ingress
- `signal-processor.js` derives receiver-side motion state
- `motion-store.js` publishes that state
- `receiver-adapters.js` contains classic app subscribers:
  - physics adapter
  - HUD adapter
  - gameplay/audio/VFX reaction adapter

This is the intended transplant shape: preserve the core, swap the adapters.

## Transplant target

When moved into the modern repo:

- shell owns pairing and calibration UI flow
- motion core stays headless
- `SignalProcessor` plus `MotionStore` form the reusable runtime center
- presentation adapters remain optional and separate from canonical motion state
