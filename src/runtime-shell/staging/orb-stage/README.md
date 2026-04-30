Orb-stage is the playable runtime harness used during development.

This area should host:
- the runtime play/test surface
- stage-specific presentation code
- staging-only orchestration around the playable runtime

Reusable gameplay systems and authored content should remain outside staging and
be imported into this harness.

## VFX Boundary

The stage is an adapter and coordinator. It wires authored presets, runtime
events, and visible hosts together, then delegates effect internals to their
domain runtime.

- DOM/SVG receiver effects may use `src/vfx/effects/` dispatch runtimes.
- True 3D orb effects should use `src/game-runtime/orb/` runtimes.
- DOM compatibility versions of 3D-authored effects should be named as
  fallbacks, not as the canonical 3D implementation.

Current extraction boundary inside the staging shell:
- the right-hand orb-stage card
- stage canvases and ground line
- orb/VFX DOM stack
- death overlay

Intentionally kept outside orb-stage:
- dev-stage panels such as dynamics, log, and tuning surfaces
- shell-owned pairing/session overlays
- shell-owned calibration and onboarding flow
- shared runtime systems and receiver/transmitter orchestration
