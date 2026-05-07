`reactor-shaft` is the first SVG-authored level package.

This package owns:
- the authored SVG map template
- the level manifest that defines world/stage scale
- any future level-specific derived metadata

Current authored source:
- `reactor-shaft.map.svg` is the canonical authored map template

Current MVP posture:
- the SVG is treated as source geometry for boundary/collision tooling
- reusable authored element families live under `elements`
