export function bootstrapStagingMvp({
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
  kwsMvpCommands = {},
  kwsBootOrchestrator = null,
  grantOrbGrace = () => {},
  orbShatterRuntime = null,
  worldSystem = null,
  clearDeathOverlaySchedule = () => {},
  closeDeathOverlay = () => {},
  renderOrbDamageVisuals = () => {},
  updateDebugReadout = () => {},
  setOrbInputSuppressed = () => {},
} = {}) {
  const ruleEngineMvpState = {
    ruleSchema,
    ruleEnginePreviewSystem,
    ruleEngineExecuteActions: RULE_ENGINE_EXECUTE_ACTIONS,
  };

  const mvp = {
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
    ...ruleEngineMvpState,
    resourcesSystem,
    orbFxSystem,
    orbSystemsBundle,
    orbRuntimeLoop,
    spellDispatchSystem,
    kwsWordProvider,
    voiceProviderManager,
    kwsVoiceProvider,
    ...kwsMvpCommands,
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
      renderOrbDamageVisuals();
      updateDebugReadout();
    },
  };

  if (mvp && kwsBootOrchestrator && typeof kwsBootOrchestrator.bootAndAutostart === "function") {
    kwsBootOrchestrator.bootAndAutostart(mvp);
  }
  if (mvp && mvp.orbSystem && typeof mvp.orbSystem.revive === "function") {
    mvp.orbSystem.revive({ health: 300, atMs: performance.now() });
  }
  mvp.lastImpact = null;
  if (orbShatterRuntime && typeof orbShatterRuntime.clear === "function") orbShatterRuntime.clear();
  setOrbInputSuppressed(false);
  if (orbFxSystem && typeof orbFxSystem.reset === "function") orbFxSystem.reset();
  if (worldSystem && typeof worldSystem.reset === "function") worldSystem.reset(performance.now());
  clearDeathOverlaySchedule();
  closeDeathOverlay();
  renderOrbDamageVisuals();
  updateDebugReadout();

  return mvp;
}
