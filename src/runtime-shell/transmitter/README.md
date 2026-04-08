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
- it still delegates the deep runtime to the existing root-level
  `mobile-transmitter.js` / `mobile-transmitter.css` during transition
- follow-on work should move runtime/bootstrap ownership here and then retire the
  old root-level transmitter entry
