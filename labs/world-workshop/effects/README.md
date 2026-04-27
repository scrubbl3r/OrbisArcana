# World Workshop Effects

Effects are scene or post-processing systems that can be reused by workshop
previews and assemblies.

## Bloom

`bloom/` owns the post-process bloom pass and reusable bloom configs. Materials
can opt into an emissive look, but bloom itself belongs to the viewport pipeline.

## Orb Surface Displacement

`orb-surface-displacement/` owns reusable vertex-displacement helpers for 3D orb
surface effects. VFX states can drive these hooks without owning shader plumbing.

