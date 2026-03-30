Runtime shell hosts the running experience around the core domains.

Responsibilities here include:
- app/session bootstrap and composition
- receiver/transmitter edge wiring
- transport/session lifecycle
- shell-side bridges between authored actions and concrete runtime hooks

This layer is intentionally above `game-runtime/` and separate from `ui/dev-console/`.
