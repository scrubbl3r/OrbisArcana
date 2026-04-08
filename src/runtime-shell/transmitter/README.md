Transmitter shell code lives here.

Use this for outbound/mobile transmitter runtime concerns and related shell
wiring.

This directory is for transmitter-role guts, not for broad staging/debug host
surfaces.

Current entry path:
- `src/runtime-shell/transmitter/mobile-transmitter.html`

Migration note:
- the current transmitter entry now lives in this domain
- `mobile-transmitter-entry.js` owns page boot at this layer
- `transmitter-lifecycle.js` now owns start/stop host state at this layer
- `transmitter-session-bootstrap.js` now owns room/relay/session bootstrap at this layer
- `transmitter-lan-session.js` now owns LAN join/session orchestration at this layer
- `transmitter-motion-input.js` now owns motion permission and browser listener wiring at this layer
- `transmitter-packet-publisher.js` now owns publish cadence, signature gating, and packet shaping at this layer
- `transmitter-audio-runtime.js` now owns phone audio synth/runtime behavior at this layer
- `transmitter-motion-core.js` now owns the live motion derivation loop at this layer
- `transmitter-runtime-reset.js` now owns runtime reset/state wipe behavior at this layer
- `gesture-lab/transmitter-gesture-lab-state.js` now owns gesture-lab persisted state and calibration state at this layer
- `gesture-lab/transmitter-gesture-lab-ui.js` now owns gesture-lab UI refs and control wiring at this layer
- `gesture-lab/transmitter-gesture-lab-logic.js` now owns gesture template math and matching logic at this layer
- `gesture-lab/transmitter-calibration-logic.js` now owns calibration basis and directional impulse helper logic at this layer
- it still delegates the deep runtime to the existing root-level
  `mobile-transmitter.js` / `mobile-transmitter.css` during transition
- follow-on work should move runtime/bootstrap ownership here and then retire the
  old root-level transmitter entry
