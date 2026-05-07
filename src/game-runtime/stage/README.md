Stage runtime owns reusable authored-stage presentation helpers.

This domain is for code that turns authored level read models into stage-facing
DOM/SVG presentation state without belonging to one staging shell surface.

Current responsibilities:
- authored overlay markup for art shapes and generated stars
- authored stage camera CSS variable application
- authored stage scene hydration/controller glue

Runtime shells should import these helpers instead of keeping generic authored
stage behavior inside `src/runtime-shell/staging/`.
