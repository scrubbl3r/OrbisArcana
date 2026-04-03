# Classic Motion Audit

This branch already exposes a compact classic motion pipeline:

`device sensors -> phone-side derivation -> Ably transport -> receiver packet normalization -> UI/game consumers`

## Current pipeline map

| Layer | Current location | Notes |
| --- | --- | --- |
| Pairing / room connect | `mobile-transmitter.js`, `game-receiver.js` | Ably setup is duplicated across transmitter/receiver and not yet isolated behind a pairing service. |
| Transport payload publish | `mobile-transmitter.js` `publishDynamics()` | Phone publishes canonical motion packet plus debug/legacy extras. |
| Calibration | `mobile-transmitter.js` `startCalibration()`, `finishCalibration()` | Calibration is phone-side today and produces basis vectors used by directional/shield derivation. |
| Signal processing | `mobile-transmitter.js` `onMotion()` and helpers | Groove, smooth, dynamics, speed, energy, shake, direction all derive here. |
| State publication | `game-receiver.js` `applyDataToUI()` | Receiver was acting as an implicit state store and consumer fan-out. |
| UI/game consumption | `game-receiver.js` | HUD, audio, stability visuals, shake gates, and physics all consume packet values directly. |

## Signal audit

| Signal | Derived From | Derived In | Consumed By | Keep / Rename / Drop | Notes |
| --- | --- | --- | --- | --- | --- |
| `energy01` | phone motion quality accumulation | `mobile-transmitter.js` | receiver energy bank, HUD, audio, background | Keep | Canonical motion signal from transmitter. |
| `groove01` | lock/autocorrelation strength | `mobile-transmitter.js` | lift derivation, HUD, audio, shake gate | Keep | Canonical. Drives multiple behaviors. |
| `dynamics01` | rotational diversity/activity | `mobile-transmitter.js` | HUD, stability/variability lamps, physics feel | Keep | Canonical. |
| `smooth01` | jerk-based smoothness | `mobile-transmitter.js` | lift derivation, HUD | Keep | Canonical. |
| `speed01` | filtered angular speed | `mobile-transmitter.js` | lift derivation, HUD, stability visual gate | Keep | Canonical. |
| `shake01` | shake meter | `mobile-transmitter.js` | receiver shake gate, HUD | Keep | Canonical, but receiver still applies local gating/cooldown. |
| `shakeHit` | double-full shake detection | `mobile-transmitter.js` | telemetry/debug, receiver event behavior | Keep | Event-like canonical signal. |
| `locked` | groove lock/grace state | `mobile-transmitter.js` | HUD, audio | Keep | Canonical state flag. |
| `hz` | autocorrelation frequency | `mobile-transmitter.js` | audio, telemetry | Keep | Useful canonical signal. |
| `sd` | directional shake classification | `mobile-transmitter.js` | receiver direction lamps | Keep | Canonical event payload for direction. |
| `accel` | accel including gravity vector | `mobile-transmitter.js` | telemetry, receiver direction readout fallback | Keep | Canonical transport input name. Legacy alias `a` may remain temporarily for compatibility. |
| `rotationRate` | rotation rate vector | `mobile-transmitter.js` | telemetry, receiver direction readout fallback | Keep | Canonical transport input name. Legacy alias `r` may remain temporarily for compatibility. |
| `lift01` | `groove01 * smooth01 * speed01` cube-root | receiver | HUD, physics | Keep | Not sent from phone; derived receiver-side today. Good MotionStore candidate. |
| energy bank points | receiver integration of `energy01` over time | receiver | HUD, shake spend gate, background, audio | Keep | Receiver/game state, not raw motion truth. |
| `spinColor` | calibrated spin-axis dominance color | `mobile-transmitter.js` | receiver shield/stability VFX | Keep as presentation-only | Not part of canonical motion truth. Legacy alias `shieldRGB` may remain temporarily for compatibility. |
| `spinAxis` | calibrated spin-axis dominance vector | `mobile-transmitter.js` | receiver debug/VFX | Keep as debug-only | Not part of canonical motion truth. Legacy alias `shieldAxis` may remain temporarily for compatibility. |
| `calib`, `calibOK`, `omegaOK` | calibration/debug flags | `mobile-transmitter.js` | receiver overlay/debug | Keep adapter-only | Useful for pairing/calibration flow, not part of motion truth. |
| `fallDrag` | constant payload field | `mobile-transmitter.js` | no meaningful receiver dependency | Drop | Looks like transport baggage. |

## Duplications and shadow state

- Receiver-side `applyDataToUI()` was serving as packet normalizer, derived-state builder, HUD updater, physics updater, and audio/VFX dispatcher all at once.
- Lift and energy-bank state were derived locally inside the render path rather than published as shared state.
- Stability, variability, shake gating, HUD values, and physics all consumed packet values directly instead of subscribing to a shared motion state.
- `shield*` naming is legacy/presentation baggage even though the underlying value is really spin-axis/VFX data. The cleanup direction is `spinColor`/`spinAxis` outside canonical motion state.

## First refactor seam

Introduce a receiver-side `MotionStore` that:

- ingests transport packets
- normalizes canonical motion fields
- derives receiver-owned state like `lift01` and energy bank level
- publishes one motion snapshot to HUD, physics, audio, and VFX consumers

That gives us a safe first SSOT without changing the transmitter motion math yet.
