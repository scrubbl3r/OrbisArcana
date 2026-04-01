The staging shell composes staging environments into a single hosted surface.

Planned responsibilities:
- own the top-level staging page
- create shared runtime/session context for staging surfaces
- mount `dev-staging` and `game-staging`
- control presentation modes such as overlay, dock, or split view

The shell should orchestrate staging surfaces, not own deep gameplay logic.

Current testing policy:
- `game-receiver.html` remains the stability baseline while migration continues
- `staging-shell.html` is the preferred URL for architecture-forward staging work
- once parity is proven here, behavior can be cut over from the legacy receiver
