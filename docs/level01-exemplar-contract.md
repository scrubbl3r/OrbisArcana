`LEVEL01` is the first authored staging level exemplar.

Its job is intentionally small:

- own the stage panel height
- own the visible level-box height
- own the authored world height/depth
- own the authored terrain silhouette
- own the default globe spawn used by the proto-level

It does not yet own:

- all world-item authoring
- full encounter scripting
- camera rules
- KWS behavior
- spell behavior
- progression logic

Current source of truth:

- [/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/levels/level01.js](/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/levels/level01.js)

Current consumers:

- [/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/game-staging.js](/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/game-staging/game-staging.js)
- [/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js](/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js)
- [/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/receiver-host-runtime-bootstrap.js](/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/receiver-host-runtime-bootstrap.js)

This is the straw-man boundary:

- enough authored shape to behave like a real level archetype
- small enough that missing responsibilities become obvious quickly
