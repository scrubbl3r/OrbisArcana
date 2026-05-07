Staging hosts non-production runtime environments.

Use this area for:
- composite staging shells that compose multiple staging surfaces
- developer/operator tooling used to inspect runtime behavior
- staging surfaces and adapters used to exercise game systems safely

Subdirectories here should host staging environments, not own reusable game
runtime, authored level schema, or canonical rendering systems.

Current taxonomy:
- `staging-shell` owns composition, mode switching, and shared staging runtime
  wiring.
- `game-stage` is the canonical full-3D stage surface.
- `orb-stage` is an orb-focused staging surface that still keeps the legacy DOM
  orb path wired until its 3D migration is complete.
- `dev-staging` owns developer/operator panels.
