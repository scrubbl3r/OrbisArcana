Dev-staging is the operator/debug environment.

This is the home for:
- meters and readouts
- controls and tuning surfaces
- logs and inspection tools
- KWS/debug boards

Use this area for staging-specific tooling, not for general-purpose shared UI
unless it proves reusable outside dev-staging.

Current transitional role during shell migration:
- the left-hand status/meter/control surface
- logs, flashboard, and tuning surfaces that will be extracted in later slices

The current split layout is temporary. Dev-staging will eventually be able to
act as a toggleable overlay within the staging shell.

Current low-risk integration seam:
- `mountDevStaging(root)` renders the surface and returns refs plus a small API
- `setStatus(html, cls)` mirrors the legacy status line behavior
- `setFatal(message)` mirrors the legacy fatal readout
- `resetMeters()` mirrors the legacy zero-state HUD reset
- `renderInputHud(vm)` mirrors the legacy left-side meter update contract

Current mount-path seam:
- `#devStagingMount` is the active mounted host inside the staging shell
- the remaining receiver-era references are historical and should continue to shrink over time
