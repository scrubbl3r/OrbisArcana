The staging shell composes staging environments into a single hosted surface.

Planned responsibilities:
- own the top-level staging page
- create shared runtime/session context for staging surfaces
- mount `dev-staging` and `game-staging`
- control presentation modes such as overlay, dock, or split view

The shell should orchestrate staging surfaces, not own deep gameplay logic.

Current testing policy:
- `staging-shell.html` is now the default harness and default smoke target
- `game-receiver.html` is archived legacy receiver code and not part of normal workflow
- new receiver/runtime work should land in the shell path, not the old root host
- remaining root receiver code should be removed rather than preserved as fallback
