`orb-stage-level` is the authored gameplay level for the split-lab orb stage.

This package exists to replace the older prototype-level assumptions with a
real level definition that participates in the same SSOT camera/runtime model
as the SVG-authored level work.

Current responsibilities:
- authored world dimensions
- authored terrain silhouette for the orb-stage backdrop
- authored camera defaults
- authored globe spawn for the gameplay shell

This level is intentionally simple and non-SVG-authored for now so the runtime
and camera slices can stabilize before we migrate more surfaces to SVG-first
authoring.
