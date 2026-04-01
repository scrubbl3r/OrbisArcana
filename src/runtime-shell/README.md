Runtime shell hosts the running experience around the core domains.

Responsibilities here include:
- app/session bootstrap and composition
- receiver/transmitter edge wiring
- transport/session lifecycle
- shell-side bridges between authored actions and concrete runtime hooks
- non-production staging environments used to host and inspect runtime behavior

Key subdomains:
- `receiver/` contains receiver-role runtime/session guts only.
- `transmitter/` contains transmitter-role runtime/session guts only.
- `staging/` contains hosted staging environments such as the composite staging shell,
  dev-staging controls, and game-staging runtime harnesses.

This layer is intentionally above `game-runtime/` and separate from any future
player-facing game UI surface.
