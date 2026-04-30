Orb runtime domain home.

This subtree is reserved for orb-specific runtime/domain logic as it is
extracted out of the receiver and generic systems layer.

## Ownership

- Orb domain models and Three.js material factories live here.
- Stateful orb behaviors that attach to the live orb live here.
- Shader-driven orb state effects, such as true 3D nod displacement and
  lifecycle damage shells, live here because they depend on orb material
  uniforms, mesh parenting, or per-frame orb runtime updates.
- Stage shells may instantiate these runtimes, but should not own their shader
  internals or effect state machines.

## Naming

- `*-model.js` builds meshes or groups.
- `*-material.js` builds materials, shaders, and material-owned lights.
- `*-runtime.js` owns live state, update loops, playback APIs, and disposal.
- `*-default.js` owns authorable default parameters for presets.

## 3D Orb Runtime Layers

- `orb-3d-runtime.js` is the base orb model/material/light runtime.
- `orb-3d-actor-runtime.js` is the live actor wrapper used by stage-style
  runtimes. It owns world placement, BO/depth state, material time, and
  intrinsic shell controls such as nod displacement.
- Separate attachment runtimes own additional meshes or particles around the
  orb, such as lifecycle damage shells and orb globes.
