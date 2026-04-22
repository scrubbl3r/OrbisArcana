`level-mvp` is the first SVG-authored level package.

This package owns:
- the authored SVG map template
- the level manifest that defines world/stage scale
- any future level-specific derived metadata

Current authored source:
- `level-mvp.svg` is the canonical authored map template

Current MVP posture:
- the SVG is treated as source geometry for boundary/collision tooling
- runtime still keeps compatibility fields such as `boundaries` and
  `worldItemSpawns` while the SVG pipeline grows in
