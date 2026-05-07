Orb-stage is a staging surface for orb-focused runtime work. It is mounted by
the staging shell, uses authored level data from the shared level domain, and
hydrates that authored data through the shared stage controller and 3D depth
runtime. The legacy DOM orb surface is still wired as a temporary compatibility
layer while the migration finishes.

This area should host:
- orb-stage adapter code
- stage-specific orb presentation code
- staging-only orchestration around the orb surface

Reusable gameplay systems and authored content should remain outside staging and
be imported into this harness.

## VFX Boundary

The stage is an adapter and coordinator. It wires authored presets, runtime
events, and visible hosts together, delegates shared stage behavior through the
game-stage adapter, and delegates effect internals to their domain runtime.

- DOM/SVG receiver effects may use `src/vfx/effects/` dispatch runtimes.
- True 3D orb effects should use `src/game-runtime/orb/` runtimes.
- DOM compatibility versions of 3D-authored effects should be named as
  fallbacks, not as the canonical 3D implementation.
- SVG level schema, hidden-layer hydration rules, and authored read-model
  access belong to `src/game-runtime/level/` and `src/content/levels/schema/`.

Current extraction boundary inside the staging shell:
- the orb-stage mounted surface
- authored stage controller, SVG overlay hydration, camera frame forwarding, and
  Three depth runtime
- legacy DOM orb/VFX compatibility stack
- death overlay

Intentionally kept outside orb-stage:
- dev-stage panels such as dynamics, log, and tuning surfaces
- shell-owned pairing/session overlays
- shell-owned calibration and onboarding flow
- shared runtime systems and receiver/transmitter orchestration
- the canonical level/game-stage rendering schema
