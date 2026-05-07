Orb-stage is a staging surface for orb-focused runtime work. It is mounted by
the staging shell, uses authored level data from the shared level domain, and
currently keeps the legacy DOM orb surface wired while the 3D migration is
prepared.

This area should host:
- orb-stage adapter code
- stage-specific orb presentation code
- staging-only orchestration around the orb surface

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
- SVG level schema, hidden-layer hydration rules, and authored read-model
  access belong to `src/game-runtime/level/` and `src/content/levels/schema/`.

Current extraction boundary inside the staging shell:
- the orb-stage mounted surface
- authored backdrop/camera adapter hooks
- legacy orb/VFX DOM stack
- death overlay

Intentionally kept outside orb-stage:
- dev-stage panels such as dynamics, log, and tuning surfaces
- shell-owned pairing/session overlays
- shell-owned calibration and onboarding flow
- shared runtime systems and receiver/transmitter orchestration
- the canonical level/game-stage rendering schema
