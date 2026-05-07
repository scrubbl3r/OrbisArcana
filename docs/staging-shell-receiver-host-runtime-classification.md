# Staging Shell Receiver Host Runtime Classification

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Classify `initShellReceiverHostRuntime(...)` in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

so we can identify the first clean extraction seam toward a shared receiver-host bootstrap helper.

## Main Conclusion

`initShellReceiverHostRuntime(...)` is currently three different responsibilities mixed together:

1. receiver runtime assembly
2. shell integration / shell glue
3. live impulse ingestion orchestration

That means the next good move is **not** to lift the whole function out blindly.

The good move is to split it conceptually first, then extract the most shared part.

## Classification

### A. Shared receiver-host bootstrap

These parts look like true receiver-host bootstrap and should eventually move into a shared bootstrap/helper:

- loading receiver init modules
- validating required receiver runtime factories
- bootstrapping staging runtime context via `bootstrapStagingRuntimeContext(...)`
- starting receiver systems:
  - `orbDamageVisualsRuntime`
  - `audioSystem`
  - `inputSystemsBundle`
  - `resourcesSystem`
  - `spellDispatchSystem`
  - `ruleEnginePreviewSystem`
  - `orbSystemsBundle`
- binding receiver runtime events via `bindStagingRuntimeEvents(...)`
- bootstrapping the receiver runtime bundle via `bootstrapStagingRuntimeBundle(...)`
- publishing `runtime.receiverRuntime` and the host-facing
  `runtime.receiverHostRuntime.processIncomingImpulse(...)` adapter

This is the clearest candidate for a future shared helper.

### B. Shell-owned integration glue

These parts should remain shell-owned, or at least be passed in as shell-specific hooks:

- shell-local receiver configs from `createShellReceiverConfigs()`
- shell stage geometry/world helpers:
  - `normalizeShellWorldItemSpawn(...)`
  - `shellGroundCenterWorld(...)`
  - `shellStageRect(...)`
  - `shellOrbScreenY(...)`
- shell gesture/lamp hooks:
  - `flashShellShakeLamp(...)`
  - `forceShellShakeLampOff(...)`
  - `clearShellDirectionLampTimers(...)`
  - `allShellDirectionLampsOff(...)`
  - `flashShellDirectionLampPair(...)`
  - `flashShellDirectionLampSingle(...)`
- shell float/color hooks:
  - `shellGrantFloatGrace(...)`
  - `shellGrantSuperGrace(...)`
  - `shellClearColorize(...)`
- shell references to:
  - `runtime.stage`
  - `runtime.orbRuntimeState`
  - `runtime.vfx`
  - `shellContext.views.devStagingView`

These do not belong in a generic shared bootstrap implementation.
They belong either in `staging-shell` or in an explicit shell hook object passed into shared bootstrap.

### C. Transitional glue / likely temporary residue

The obvious receiver-host assembly residue has been folded into explicit
bootstrap seams. Future cleanup should focus on reducing shell hook breadth
after the shared extraction point is stable.

## The Three Internal Seams

### Seam 1: Runtime assembly

This is the most shared part:

- create runtime context
- start systems
- bind runtime events
- create receiver runtime

This is the best candidate for the **first shared bootstrap extraction**.

### Seam 2: Shell hook bundle

This is the shell-specific dependency surface that should likely be passed into the shared bootstrap:

- lamp hooks
- float/color hooks
- world/stage geometry helpers
- stage runtime refs
- dev HUD sink

This should stay explicit and injected, not hidden.

### Seam 3: Impulse processing adapter

`receiverHostRuntime.processIncomingImpulse(...)` is its own seam:

- ingest input packet
- update stability visuals
- route shake sample
- leave HUD rendering in the shell-owned `MotionStore` path

This is partly shared receiver behavior and partly shell-view glue.

It should probably become a dedicated adapter/helper after runtime assembly is extracted.

## Recommendation

The next implementation slice should target **Seam 1** only:

- extract receiver runtime assembly/startup from `initShellReceiverHostRuntime(...)`

Do **not** try to extract shell hooks and impulse/UI glue in the same slice.

That would be too many responsibilities at once.

## Best First Extraction Shape

Create a helper with a shape roughly like:

- input:
  - receiver module factories
  - shell KWS/runtime dependencies
  - shell hook bundle
  - shell geometry/runtime adapters
- output:
  - `runtimeContext`
  - started systems
  - `receiverRuntime`
- a `processIncomingImpulse(...)` function

The first version can still live close to `staging-shell`, but it should be a distinct bootstrap seam rather than inline shell code.

## Recommendation To User

If we want the safest next code step:

- extract the receiver runtime assembly/startup portion into one dedicated helper
- attach `processIncomingImpulse(...)` from the receiver-host bootstrap
- leave shell gesture/lamp/float hooks in `staging-shell`

That gives us the cleanest low-risk path toward making `staging-shell` the real primary host without destabilizing the active behavior.
