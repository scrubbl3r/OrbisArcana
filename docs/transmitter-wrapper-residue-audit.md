## Transmitter Wrapper Residue Audit

Date: 2026-04-07

### Main conclusion

`/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/mobile-transmitter.js` is no longer acting like a hidden second transmitter runtime.

After the recent extraction work, it is now mostly a transitional wrapper around the authoritative transmitter-domain modules under:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/`

The live motion derivation core now runs from:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/transmitter/transmitter-motion-core.js`

That means the remaining root-level file should now be understood as a wrapper/composer, not as unresolved motion-core residue.

### What has already moved out

The following domains are now owned by transmitter-domain modules:

- entry page bootstrap
- page shell ownership
- UI boot / theme / version / background hooks
- viewport boot
- session/bootstrap ownership
- lifecycle ownership
- gesture-lab state
- gesture-lab UI
- gesture-lab logic
- calibration helper logic
- motion permission / browser listener shell
- packet shaping / send cadence
- audio runtime
- runtime reset helpers
- live motion derivation core

### What still remains in `mobile-transmitter.js`

What still meaningfully lives in the root wrapper now falls into four buckets.

#### 1. Host composition glue

The wrapper still wires together the domain modules that are exposed on `window`, including:

- page shell refs and fallbacks
- lifecycle hooks
- session bootstrap hooks
- motion input hooks
- packet publisher hooks
- audio runtime hooks
- runtime reset hooks
- motion-core construction

This is legitimate temporary composition code.

#### 2. LAN / join orchestration

The wrapper still owns the active join/session control flow:

- LAN signaling setup
- WebRTC pair negotiation
- hello/offer/answer/ice handling
- phone-started handshake
- relay/LAN switching glue

This is currently the largest remaining real runtime family in the wrapper.

#### 3. Gesture-lab runtime orchestration

Although gesture-lab state/UI/logic moved out, the wrapper still owns the live orchestration around those pieces:

- motion history buffering for recognition
- gravity-lock progress behavior
- record / stop / save flow
- live test-mode matching updates
- calibration start / finish flow
- directional impulse classification handoff

This is still meaningful, but it is wrapper-shaped orchestration rather than core signal math.

#### 4. Start/stop runtime composition

The wrapper still owns the top-level runtime lifecycle composition:

- `start()`
- `stop()`
- motion permission gate handoff
- audio resume / silence handoff
- listener attach/detach handoff
- runtime reset handoff
- calibration pending handoff

This is appropriate as long as the wrapper still exists.

### What is no longer true

The old root phone file no longer meaningfully owns:

- the motion derivation engine
- packet publish mechanics
- browser motion listener ownership
- audio engine internals
- reset-state internals
- the old shadow copy of speed/groove/shake/dynamics math

That old shadow core was removed in the latest cleanup slice.

### Architectural read

The remaining wrapper is now honest.

It is basically:

- transitional host composition
- live join/session orchestration
- gesture/calibration orchestration
- top-level start/stop glue

That is a much healthier boundary than before.

### Best recommendation

Do not keep splitting `mobile-transmitter.js` just because it still exists.

The best next decision is now architectural:

1. Keep the wrapper for a while as the transitional phone composer.
2. If we keep pushing, the next real extraction seam should be LAN/session orchestration, not motion math.

### Recommended stopping point

It is reasonable to stop here for now.

Why:

- the core is isolated
- the wrapper is no longer pretending to be the engine
- further extraction should now be driven by product/runtime goals, not migration guilt

### If we continue later

The most logical next target would be a dedicated transmitter session/runtime module owning:

- LAN join state
- signaling lifecycle
- WebRTC data channel lifecycle
- phone-started handshake
- transport switching between relay and LAN

That would leave the root wrapper even thinner and make eventual root-file deletion realistic.
