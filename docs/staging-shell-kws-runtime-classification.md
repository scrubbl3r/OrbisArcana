# Staging Shell KWS Runtime Classification

Date: 2026-04-06
Branch: `ssot-runtime-shell-cleanup`

## Goal

Classify `initShellKwsRuntime(...)` in:

- `/Users/garthwilliams/Desktop/__DEV__/OrbisArcana/src/runtime-shell/staging/staging-shell/create-staging-shell-runtime.js`

so we can identify the next clean extraction seam without destabilizing the active shell host.

## Main Conclusion

`initShellKwsRuntime(...)` is currently a mixed domain made of four distinct responsibilities:

1. reusable KWS runtime boot
2. dev-surface KWS bridge wiring
3. shell gameplay/spell/VFX integration
4. shell-local wake-window / rule trace helpers

So the next good move is **not** to lift the whole function into one giant helper.

The good move is to split it by responsibility.

## Classification

### A. Reusable KWS runtime boot

These parts look like genuine KWS/bootstrap responsibilities and are strong candidates for shared extraction:

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
- runtime controller startup:
  - backend selection
  - voice engine selection
  - mic enable
  - autostart watchdog

This is the clearest candidate for a future dedicated KWS bootstrap helper.

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

These parts are clearly shell/game integration and should not be hidden inside generic KWS bootstrap:

- `hydrateReceiverBootstrapState(...)` with shell-specific no-op setters
- shell VFX default hydration
- `initShellReceiverVfxRuntime(...)`
- shell spell action handlers:
  - `createSpellActionHandlersImported(...)`
- shell spell cast executor:
  - `createSpellCastExecutor(...)`
- shell gameplay hooks:
  - `shellTeleportOrbToSpawnNeutralizePhysics(...)`
  - `shellActivateBubbleShield(...)`
  - `shellGrantSuperGrace(...)`
  - `shellApplyColorize(...)`
  - `shellClearColorize(...)`
- shell rule-action execution bridge:
  - `bindShellRuleActionRuntime(...)`

This is not “KWS runtime” in the pure sense.
It is shell spell/gameplay integration attached to KWS/rule events.

### D. Shell-local wake-window and trace helpers

These parts are still embedded in the shell file and look like their own small subdomain:

- `buildShellRootWakeWindowMap(...)`
- `bindShellRootWakeWindows(...)`
- `bindShellWakeWindowVisuals(...)`
- rule/action trace log subscriptions

They are related to KWS, but they are not the same as KWS provider/runtime boot.

These likely deserve a separate shell KWS bridge helper rather than staying in the main runtime file forever.

## What `runtime.kws` Currently Represents

`runtime.kws` currently stores a very broad bundle:

- KWS bridge/panel/controller/orchestrator/runtime providers
- listen policy state
- schema/word indexes
- rule engine preview system
- shell spell handlers / executor / rule runtime
- bridge disposers / trace subscriptions

That is useful at runtime, but it also reflects how many responsibilities are currently merged into one lane.

## Best Next Extraction Options

### Option 1: Extract reusable KWS bootstrap first

Move out the part that creates:

- `kwsBridge`
- `kwsPanelController`
- `kwsRuntimeController`
- `kwsBootOrchestrator`
- `kwsVoiceRuntime`
- `kwsListenPolicyController`
- base KWS event binding

Keep shell spell/VFX integration and shell wake-window helpers at the call site for now.

Pros:

- lowest-risk KWS extraction
- creates a real KWS bootstrap seam
- does not hide shell gameplay wiring inside a generic helper

Cons:

- `initShellKwsRuntime(...)` would still remain substantial

### Option 2: Extract shell KWS/gameplay bridge first

Move out:

- shell spell action handler creation
- shell spell executor creation
- shell rule-action runtime binding
- shell wake-window bridge/visuals

Pros:

- directly reduces the shell-specific knot

Cons:

- more behavior-sensitive
- more entangled with spell/VFX/runtime semantics

## Recommendation

I recommend **Option 1 first**:

- extract reusable KWS bootstrap first

Reason:

- it follows the same pattern that worked for receiver-host bootstrap and pairing bootstrap
- it preserves a clear boundary:
  - generic KWS/runtime boot
  - shell-specific spell/VFX/dev-surface wiring
- it is the safer way to thin `create-staging-shell-runtime.js`

## Suggested Boundary

The first KWS helper should probably return a bundle roughly like:

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
- base KWS event disposers

Then `create-staging-shell-runtime.js` can keep:

- shell VFX/spell integration
- shell wake-window visuals/trace hookups
- final `runtime.kws` assembly

## Recommendation To User

If we continue right now, the best next slice is:

- extract the reusable KWS bootstrap/runtime construction lane

Not:

- shell spell/VFX integration
- not wake-window visual behavior
- not rule-action execution glue

Those can come after the base KWS bootstrap seam is real.
