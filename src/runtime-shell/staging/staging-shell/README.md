The staging shell composes staging environments into a single hosted surface.

Planned responsibilities:
- own the top-level staging page
- create shared runtime/session context for staging surfaces
- mount `dev-staging` and `orb-stage`
- control presentation modes such as `split-lab` and `level-stage`

The shell should orchestrate staging surfaces, not own deep gameplay logic.

Current shell mode policy:
- `split-lab` is the default bounded workbench: `dev-stage` left, `orb-stage` right
- `level-stage` is the immersive shell mode: full-window main stage with toggleable dev-stage rail
- shell hotkeys are guarded behind `Cmd+Shift+1`, `Cmd+Shift+2`, and `Cmd+Shift+D`

Current testing policy:
- `staging-shell.html` is now the default harness and default smoke target
- the old root-host path has been sunset and is not part of normal workflow
- new receiver/runtime work should land in the shell path, not the old root host
- remaining root-host code should be removed rather than preserved as fallback
