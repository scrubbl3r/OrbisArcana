# Staging Shell KWS Runtime Classification

Date: 2026-05-07
Branch: `05/06/26-Orbis-Arcana-3D`

## Goal

Classify `initShellKwsRuntime(...)` in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

so we can identify the next clean extraction seam without destabilizing the active shell host.

## Main Conclusion

`initShellKwsRuntime(...)` is currently a shell composition point built from four distinct responsibilities:

1. reusable KWS runtime boot
2. dev-surface KWS bridge wiring
3. shell gameplay/spell/VFX integration
4. shell-local wake-window / rule trace helpers

The first pass of that split is now done.

The good move remains to split by responsibility, but the current decision point is no longer "where is the KWS bootstrap seam?" It is now "how thin should the remaining shell composer become before promotion?"

## Classification

### A. Reusable KWS runtime boot

These parts are now extracted into:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/kws-runtime-bootstrap.js`

The extracted helper owns:

- shared module lookup/validation for:
  - `bootstrapKwsStaging`
  - `createKwsPanelController`
  - `createKwsRuntimeController`
  - `createKwsBootOrchestrator`
  - `bindKwsEventHandlers`
  - `createKwsListenPolicyController`
  - `bootstrapKwsVoiceRuntime`
  - `createKwsRuntimeConfig`
  - `createKwsReceiverBridge`
- provider/bootstrap setup:
  - `createKwsProvider`
  - `createVoiceProviderManager`
  - `createOpenWakeWordBrowserBackendFactory`
- event bus creation
- KWS panel/runtime/controller/orchestrator bootstrap
- KWS voice runtime bootstrap
- listen policy controller bootstrap
- base KWS runtime commands
- KWS runtime config

The remaining runtime controller startup call still happens from `initShellKwsRuntime(...)`, but the base runtime/controller/orchestrator/provider construction lane is real.

### B. Dev-surface KWS bridge glue

These parts are shell/dev-surface integration and should remain explicit at the boundary:

- `createDevStagingPanelElements: () => createShellDevStagingPanelElements(devRefs)`
- tune reads from UI:
  - `kwsTokenThrInput`
  - `kwsCooldownMsInput`
- readout updates:
  - `rulesReadout`
  - `kwsBridge.updateReadout()`
  - log pushes to the dev surface

This is not generic KWS runtime logic.
It is the shell/dev-surface bridge.

### C. Shell-local gameplay / spell / VFX integration

These parts are clearly shell/game integration and should not be hidden inside generic KWS bootstrap.

Already extracted:

- voice spell cast handling:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-voice-spell-runtime.js`
- spell action handler / cast executor assembly:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-spell-action-runtime.js`
- rule-action execution bridge:
  - `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/shell-rule-action-runtime.js`

Still composed in `initShellKwsRuntime(...)`:

- `hydrateReceiverBootstrapState(...)` with shell-specific state capture
- shell VFX default hydration
- `initShellReceiverVfxRuntime(...)`
- shell gameplay hooks:
  - `shellTeleportOrbToSpawnNeutralizePhysics(...)`
  - `shellActivateBubbleShield(...)`
  - `shellGrantOrbGrace(...)`
  - `shellApplyColorize(...)`
  - `shellClearColorize(...)`

This is not “KWS runtime” in the pure sense.
It is shell spell/gameplay integration attached to KWS/rule events. The heavy assembly now has named helper modules; the shell composer still supplies concrete stage/VFX callbacks.

### D. Shell-local wake-window and trace helpers

Wake-window behavior is now extracted into:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/kws-wake-window-bridge.js`

Still embedded in the shell file:

- rule/action trace log subscriptions

They are related to KWS, but they are not the same as KWS provider/runtime boot.

The remaining trace subscriptions may eventually move into a shell KWS composition helper, but they are low-risk to keep at the composition point for now.

## What `runtime.kws` Currently Represents

`runtime.kws` currently stores a very broad bundle:

- KWS bridge/panel/controller/orchestrator/runtime providers
- listen policy state
- schema/word indexes
- rule engine preview system
- shell spell handlers / executor / rule runtime from extracted helper modules
- bridge disposers / trace subscriptions

That is useful at runtime, but it also reflects how many responsibilities are currently merged into one lane.

## Best Next Extraction Options

### Option 1: Keep the current modular composition

Already done:

- `kwsBridge`
- `kwsPanelController`
- `kwsRuntimeController`
- `kwsBootOrchestrator`
- `kwsVoiceRuntime`
- `kwsListenPolicyController`
- KWS runtime commands
- wake-window bridge/visuals
- voice spell bridge
- spell action runtime assembly
- rule-action runtime bridge

Keep final shell composition, trace subscriptions, runtime startup, and `runtime.kws` assembly at the call site for now.

Pros:

- the responsibilities are now named
- `create-staging-shell-runtime.js` remains the shell composition owner
- avoids another large behavior-sensitive move

Cons:

- `initShellKwsRuntime(...)` remains substantial

### Option 2: Extract a shell KWS composition helper

Move out:

- KWS event handler binding
- listen-policy sync bridge
- rule/action trace subscriptions
- calls into wake-window, spell action, voice spell, and rule-action helpers
- final `runtime.kws` assembly

Pros:

- directly thins `create-staging-shell-runtime.js`
- creates a named KWS composition boundary

Cons:

- more behavior-sensitive
- risks moving composition complexity without simplifying it

## Recommendation

I recommend **Option 1 for now**:

- keep the current modular composition and smoke it

Reason:

- the highest-value extractions are now complete
- the remaining code is shell composition, not generic KWS bootstrap residue
- another extraction would be mostly aesthetic unless we specifically want a thinner composer before promotion

## Suggested Boundary

Current extracted KWS/runtime helper returns a bundle roughly like:

- `eventBus`
- `kwsBridge`
- `kwsPanelController`
- `kwsTokenUiState`
- `kwsRuntimeController`
- `kwsBootOrchestrator`
- `kwsWordProvider`
- `kwsVoiceProvider`
- `voiceProviderManager`
- `kwsListenPolicyController`
- `runtimeConfig`
- `kwsDebugState`
- `kwsBackendKey`
- `receiverEvents`
- `kwsRuntimeCommands`

Current shell helper modules own:

- wake-window bridge/visuals
- voice spell dispatch
- spell action runtime assembly
- rule-action execution bridge

`create-staging-shell-runtime.js` still owns:

- shell VFX initialization
- concrete shell gameplay callbacks
- KWS event binding and trace subscriptions
- final `runtime.kws` assembly

## Recommendation To User

If we continue right now, the best next slice is probably:

- either smoke/readiness audit for promoting the staging shell
- or a deliberately small shell-composer extraction for trace/listen-policy/final assembly

Not:

- another broad KWS bootstrap extraction, because that seam is already real.
