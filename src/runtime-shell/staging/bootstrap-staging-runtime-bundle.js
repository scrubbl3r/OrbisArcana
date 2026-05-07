function clearOrbStageLegacyDomOrbShatterPresentation({
  clearLegacyDomOrbShatterRuntime: clearOrbStageLegacyDomOrbShatterRuntime = () => {},
} = {}) {
  clearOrbStageLegacyDomOrbShatterRuntime();
}

export function bootstrapStagingRuntimeBundle({
  eventBus,
  gameState,
  orbSystem,
  orbDamageVisualsRuntime,
  audioSystem,
  inputSystemsBundle,
  inputSystem,
  inputDynamicsSystem,
  inputGestureSystem,
  orbRuntimeState,
  ruleSchema = null,
  ruleEnginePreviewSystem = null,
  RULE_ENGINE_EXECUTE_ACTIONS = false,
  resourcesSystem = null,
  orbFxSystem = null,
  orbSystemsBundle = null,
  orbRuntimeLoop = null,
  spellDispatchSystem = null,
  kwsWordProvider = null,
  voiceProviderManager = null,
  kwsVoiceProvider = null,
  kwsRuntimeCommands = {},
  kwsBootOrchestrator = null,
  grantOrbGrace = () => {},
  clearLegacyDomOrbShatterRuntime: clearOrbStageLegacyDomOrbShatterRuntime = () => {},
  worldSystem = null,
  clearDeathOverlaySchedule = () => {},
  closeDeathOverlay = () => {},
  renderLegacyDomOrbDamageVisuals: renderOrbStageLegacyDomOrbDamageVisuals = () => {},
  updateDebugReadout = () => {},
  setOrbInputSuppressed = () => {},
} = {}) {
  const ruleEngineRuntimeState = {
    ruleSchema,
    ruleEnginePreviewSystem,
    ruleEngineExecuteActions: RULE_ENGINE_EXECUTE_ACTIONS,
  };

  const receiverRuntime = {
    eventBus,
    gameState,
    orbSystem,
    orbDamageVisualsRuntime,
    audioSystem,
    inputSystemsBundle,
    inputSystem,
    inputDynamicsSystem,
    inputGestureSystem,
    orbRuntimeState,
    ...ruleEngineRuntimeState,
    resourcesSystem,
    orbFxSystem,
    orbSystemsBundle,
    orbRuntimeLoop,
    spellDispatchSystem,
    kwsWordProvider,
    voiceProviderManager,
    kwsVoiceProvider,
    ...kwsRuntimeCommands,
    grantOrbGrace,
    lastImpact: null,
    applyImpact(impact, source, meta = {}) {
      this.lastImpact = {
        impact: Number(impact) || 0,
        source: source || "unknown",
        rawImpact: Number(meta.rawImpact) || 0,
        gravityMul: Number(meta.gravityMul) || 0,
        fallDrag: Number(meta.fallDrag) || 0,
        atMs: performance.now(),
      };
      orbSystem.applyImpact({ impact, source, atMs: performance.now() });
      renderOrbStageLegacyDomOrbDamageVisuals();
      updateDebugReadout();
    },
  };

  if (receiverRuntime && kwsBootOrchestrator && typeof kwsBootOrchestrator.bootAndAutostart === "function") {
    kwsBootOrchestrator.bootAndAutostart(receiverRuntime);
  }
  if (receiverRuntime && receiverRuntime.orbSystem && typeof receiverRuntime.orbSystem.revive === "function") {
    receiverRuntime.orbSystem.revive({ health: 300, atMs: performance.now() });
  }
  receiverRuntime.lastImpact = null;
  clearOrbStageLegacyDomOrbShatterPresentation({
    clearLegacyDomOrbShatterRuntime: clearOrbStageLegacyDomOrbShatterRuntime,
  });
  setOrbInputSuppressed(false);
  if (orbFxSystem && typeof orbFxSystem.reset === "function") orbFxSystem.reset();
  if (worldSystem && typeof worldSystem.reset === "function") worldSystem.reset(performance.now());
  clearDeathOverlaySchedule();
  closeDeathOverlay();
  renderOrbStageLegacyDomOrbDamageVisuals();
  updateDebugReadout();

  return receiverRuntime;
}
