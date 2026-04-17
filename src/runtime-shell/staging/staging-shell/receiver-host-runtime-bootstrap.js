export async function bootstrapShellReceiverHostRuntimeAssembly({
  shellContext = null,
  runtime = null,
  sharedModules = null,
  shellKws = null,
  receiverConfigs = null,
  createReceiverStabilityVisualController = null,
  setLamp = null,
  stageAdapters = null,
  shellHooks = null,
} = {}) {
  if (!runtime || !sharedModules || !shellKws) return null;

  const receiverBootstrapModule = sharedModules.receiverBootstrapModule || null;
  const bootstrapStagingRuntimeContext =
    sharedModules.bootstrapStagingRuntimeContextModule &&
    sharedModules.bootstrapStagingRuntimeContextModule.bootstrapStagingRuntimeContext;
  const bindStagingRuntimeEvents =
    sharedModules.bindStagingRuntimeEventsModule &&
    sharedModules.bindStagingRuntimeEventsModule.bindStagingRuntimeEvents;
  const bootstrapStagingMvp =
    sharedModules.bootstrapStagingMvpModule &&
    sharedModules.bootstrapStagingMvpModule.bootstrapStagingMvp;
  const loadReceiverInitModules =
    receiverBootstrapModule &&
    receiverBootstrapModule.loadReceiverInitModules;
  if (
    typeof bootstrapStagingRuntimeContext !== "function" ||
    typeof bindStagingRuntimeEvents !== "function" ||
    typeof bootstrapStagingMvp !== "function" ||
    typeof loadReceiverInitModules !== "function"
  ) {
    return null;
  }

  const mods = shellKws.receiverMods || await loadReceiverInitModules();
  shellKws.receiverMods = mods;

  const {
    buildInputHudViewModelImported: buildInputHudViewModel,
    createGameState,
    createOrbDamageVisualsRuntime,
    createAudioSystem,
    createInputSystemsBundle,
    createResourcesSystem,
    createSpellDispatchSystem,
    createWorldSystem,
    createOrbSystemsBundle,
    createOrbSystem,
    createOrbFxSystem,
    createRuleEnginePreviewSystem,
    runInputFramePipelineImported,
    WORLD_ITEMS,
  } = mods || {};
  if (
    typeof createGameState !== "function" ||
    typeof createOrbDamageVisualsRuntime !== "function" ||
    typeof createAudioSystem !== "function" ||
    typeof createInputSystemsBundle !== "function" ||
    typeof createResourcesSystem !== "function" ||
    typeof createSpellDispatchSystem !== "function" ||
    typeof createWorldSystem !== "function" ||
    typeof createOrbSystemsBundle !== "function" ||
    typeof createOrbSystem !== "function" ||
    typeof createOrbFxSystem !== "function" ||
    typeof runInputFramePipelineImported !== "function"
  ) {
    return null;
  }

  const {
    IMPACT_TH,
    ENERGY_BANK_CAP,
    ENERGY_SHAKE_COST,
    ENERGY_CHARGE_RATE_PPS,
    INPUT_GESTURE_CFG,
    INPUT_DYNAMICS_CFG,
  } = receiverConfigs || {};

  const receiverHostState = {
    stabilityVisualGate: true,
  };

  const receiverStabilityVisualController =
    typeof createReceiverStabilityVisualController === "function"
      ? createReceiverStabilityVisualController({
          getInputDynamicsSystem: () => receiverHostState.inputDynamicsSystem,
          getStabilityVisualGate: () => receiverHostState.stabilityVisualGate,
          getRefs: () => ((shellContext && shellContext.refs) ? shellContext.refs.dev : null),
          setLamp,
        })
      : null;

  const applyStabilityVisuals = () => {
    if (receiverStabilityVisualController && typeof receiverStabilityVisualController.apply === "function") {
      receiverStabilityVisualController.apply();
    }
  };

  const isDiversityLampLit = () => (
    receiverStabilityVisualController && typeof receiverStabilityVisualController.isDiversityLampLit === "function"
      ? !!receiverStabilityVisualController.isDiversityLampLit()
      : false
  );

  const stageWorldItemSpawns =
    stageAdapters && typeof stageAdapters.getWorldItemSpawns === "function"
      ? stageAdapters.getWorldItemSpawns()
      : null;

  const runtimeContext = bootstrapStagingRuntimeContext({
    createEventBus: () => runtime.eventBus,
    createGameState,
    createOrbDamageVisualsRuntime,
    createAudioSystem,
    createInputSystemsBundle,
    createResourcesSystem,
    createSpellDispatchSystem,
    createRuleEnginePreviewSystem,
    createWorldSystem,
    createOrbSystemsBundle,
    createOrbSystem,
    createOrbFxSystem,
    els: shellContext.stageEls,
    IMPACT_TH,
    INPUT_DYNAMICS_CFG,
    INPUT_GESTURE_CFG,
    ENERGY_BANK_CAP,
    ENERGY_SHAKE_COST,
    ENERGY_CHARGE_RATE_PPS,
    ruleSchema: shellKws.ruleSchema,
    RULE_ENGINE_EXECUTE_ACTIONS: true,
    DEFAULT_KWS_LISTEN_POLICY_MODE: "A",
    STRICT_A_WAKE_WINDOW_PAD_MS: 4000,
    kwsListenPolicyController: shellKws.kwsListenPolicyController,
    kwsBridge: shellKws.kwsBridge,
    RULE_CHAIN_TRACE_ENABLED: true,
    PHYS: stageAdapters && typeof stageAdapters.getPhys === "function" ? stageAdapters.getPhys() : {},
    worldItemSpawns: Array.isArray(stageWorldItemSpawns) && stageWorldItemSpawns.length
      ? stageWorldItemSpawns
      : (Array.isArray(WORLD_ITEMS) ? WORLD_ITEMS : []),
    normalizeWorldItemSpawn: (item) => (
      stageAdapters && typeof stageAdapters.normalizeWorldItemSpawn === "function"
        ? stageAdapters.normalizeWorldItemSpawn(item)
        : null
    ),
    groundCenterWorld: () => (
      stageAdapters && typeof stageAdapters.groundCenterWorld === "function"
        ? stageAdapters.groundCenterWorld()
        : 0
    ),
    stageRect: () => (
      stageAdapters && typeof stageAdapters.stageRect === "function"
        ? stageAdapters.stageRect()
        : { width: 0, height: 0 }
    ),
    pickupScreenY: (yW) => (
      stageAdapters && typeof stageAdapters.pickupScreenY === "function"
        ? stageAdapters.pickupScreenY(yW)
        : Number(yW || 0)
    ),
    getOrbRuntime: () => (
      stageAdapters && typeof stageAdapters.getOrbRuntime === "function"
        ? stageAdapters.getOrbRuntime()
        : { yW: 0 }
    ),
    getOrbScreenY: () => (
      stageAdapters && typeof stageAdapters.getOrbScreenY === "function"
        ? stageAdapters.getOrbScreenY()
        : 0
    ),
    getOrbVisualRadiusPx: () => (
      stageAdapters && typeof stageAdapters.getOrbVisualRadiusPx === "function"
        ? stageAdapters.getOrbVisualRadiusPx()
        : 0
    ),
    axisToColor01: (axis) => (
      stageAdapters && typeof stageAdapters.axisToColor01 === "function"
        ? stageAdapters.axisToColor01(axis)
        : 0
    ),
    gestureHooks: {
      isDiversityLampLit,
      flashShakeLamp: () => {
        if (shellHooks && typeof shellHooks.flashShakeLamp === "function") shellHooks.flashShakeLamp();
      },
      triggerShockwave: () => {
        if (shellHooks && typeof shellHooks.triggerShockwave === "function") shellHooks.triggerShockwave();
      },
      forceShakeLampOff: () => {
        if (shellHooks && typeof shellHooks.forceShakeLampOff === "function") shellHooks.forceShakeLampOff();
      },
      clearDirLampTimers: () => {
        if (shellHooks && typeof shellHooks.clearDirLampTimers === "function") shellHooks.clearDirLampTimers();
      },
      allDirLampOff: () => {
        if (shellHooks && typeof shellHooks.allDirLampOff === "function") shellHooks.allDirLampOff();
      },
      flashDirLampPair: (a, b, ms) => {
        if (shellHooks && typeof shellHooks.flashDirLampPair === "function") shellHooks.flashDirLampPair(a, b, ms);
      },
      flashDirLampSingle: (code, ms) => {
        if (shellHooks && typeof shellHooks.flashDirLampSingle === "function") shellHooks.flashDirLampSingle(code, ms);
      },
    },
  });

  receiverHostState.inputSystemsBundle = runtimeContext.inputSystemsBundle;
  receiverHostState.inputSystem = runtimeContext.inputSystem;
  receiverHostState.inputDynamicsSystem = runtimeContext.inputDynamicsSystem;
  receiverHostState.inputGestureSystem = runtimeContext.inputGestureSystem;
  receiverHostState.resourcesSystem = runtimeContext.resourcesSystem;
  receiverHostState.spellDispatchSystem = runtimeContext.spellDispatchSystem;
  receiverHostState.orbDamageVisualsRuntime = runtimeContext.orbDamageVisualsRuntime;
  receiverHostState.audioSystem = runtimeContext.audioSystem;
  receiverHostState.orbSystemsBundle = runtimeContext.orbSystemsBundle;

  if (receiverHostState.orbDamageVisualsRuntime && typeof receiverHostState.orbDamageVisualsRuntime.start === "function") {
    receiverHostState.orbDamageVisualsRuntime.start();
  }
  if (receiverHostState.audioSystem && typeof receiverHostState.audioSystem.start === "function") {
    receiverHostState.audioSystem.start();
  }
  if (receiverHostState.inputSystemsBundle && typeof receiverHostState.inputSystemsBundle.start === "function") {
    receiverHostState.inputSystemsBundle.start();
  }
  if (receiverHostState.resourcesSystem && typeof receiverHostState.resourcesSystem.start === "function") {
    receiverHostState.resourcesSystem.start();
  }
  if (receiverHostState.spellDispatchSystem && typeof receiverHostState.spellDispatchSystem.start === "function") {
    receiverHostState.spellDispatchSystem.start();
  }
  if (runtimeContext.ruleEnginePreviewSystem && typeof runtimeContext.ruleEnginePreviewSystem.start === "function") {
    runtimeContext.ruleEnginePreviewSystem.start();
  }
  if (receiverHostState.orbSystemsBundle && typeof receiverHostState.orbSystemsBundle.start === "function") {
    receiverHostState.orbSystemsBundle.start();
  }

  if (shellKws.ruleEnginePreviewSystem && typeof shellKws.ruleEnginePreviewSystem.stop === "function") {
    shellKws.ruleEnginePreviewSystem.stop();
  }
  shellKws.ruleEnginePreviewSystem = runtimeContext.ruleEnginePreviewSystem || shellKws.ruleEnginePreviewSystem;
  if (shellKws.shellRuleActionRuntime && typeof shellKws.shellRuleActionRuntime.dispose === "function") {
    shellKws.shellRuleActionRuntime.dispose();
  }
  if (shellKws.kwsRootWakeBridge && typeof shellKws.kwsRootWakeBridge.dispose === "function") {
    shellKws.kwsRootWakeBridge.dispose();
  }

  const castActionForWordId = (wordId) => {
    const key = String(wordId || "").trim().toLowerCase();
    const entry = shellKws.runtimeWordIndex[key] || shellKws.runtimeSpellIndex[key] || null;
    return String((entry && entry.castActionId) || key || "");
  };

  const eventBinder = bindStagingRuntimeEvents({
    eventBus: runtime.eventBus,
    RECEIVER_EVENTS: shellKws.receiverEvents,
    RULE_ENGINE_ACTION_EXECUTED_EVENT: "rule_engine.action_executed",
    RULE_ENGINE_PREVIEW_MATCHED_EVENT: "rule_engine.preview_matched",
    RULE_ENGINE_WAKE_WIN_OPENED_EVENT: "rule_engine.wake_win_opened",
    RULE_ENGINE_SOURCE_EVENT_SUMMARY_EVENT: "rule_engine.source_event_summary",
    RULE_ENGINE_TRIGGER: "rule_engine",
    RULE_CHAIN_TRACE_ENABLED: true,
    DEFAULT_KWS_GATE_TIMEOUT_MS: 1500,
    kwsBridge: shellKws.kwsBridge,
    kwsListenPolicyController: shellKws.kwsListenPolicyController,
    kwsRuntimeController: shellKws.kwsRuntimeController,
    kwsPanelController: shellKws.kwsPanelController,
    kwsTokenUiState: shellKws.kwsTokenUiState,
    TEMP_UNGATED_KWS_TOKENS: new Set(),
    kwsDebugState: shellKws.kwsDebugState,
    ruleSchema: shellKws.ruleSchema,
    runtimeWordIndex: shellKws.runtimeWordIndex,
    runtimeSpellIndex: shellKws.runtimeSpellIndex,
    castActionForWordId,
    executeWordCastAction: (castActionId, context = {}) => (
      shellKws.shellSpellCastExecutor && typeof shellKws.shellSpellCastExecutor.execute === "function"
        ? shellKws.shellSpellCastExecutor.execute(castActionId, context)
        : { handled: false }
    ),
    playElectricAoe: () => (
      shellHooks && typeof shellHooks.playElectricAoe === "function"
        ? shellHooks.playElectricAoe()
        : { handled: false }
    ),
    playOrbNod: (payload = {}) => (
      shellHooks && typeof shellHooks.playOrbNod === "function"
        ? shellHooks.playOrbNod(payload)
        : { handled: false }
    ),
    clearFloatGrace: () => {
      if (shellHooks && typeof shellHooks.clearFloatGrace === "function") shellHooks.clearFloatGrace();
    },
    renderOrbDamageVisuals: () => {
      if (shellHooks && typeof shellHooks.renderOrbDamageVisuals === "function") shellHooks.renderOrbDamageVisuals();
    },
    spawnShardFx: (payload) => {
      if (shellHooks && typeof shellHooks.spawnShardFx === "function") shellHooks.spawnShardFx(payload);
    },
    clearOrbRuntimeFxForDeath: () => {
      if (shellHooks && typeof shellHooks.clearOrbRuntimeFxForDeath === "function") shellHooks.clearOrbRuntimeFxForDeath();
    },
    scheduleDeathOverlay: () => {
      if (shellHooks && typeof shellHooks.scheduleDeathOverlay === "function") shellHooks.scheduleDeathOverlay();
    },
    updateDebugReadout: () => {
      if (shellHooks && typeof shellHooks.updateDebugReadout === "function") shellHooks.updateDebugReadout();
    },
    orbShatterController: shellHooks && shellHooks.orbShatterController ? shellHooks.orbShatterController : null,
    stopShardSim: () => {
      if (shellHooks && typeof shellHooks.stopShardSim === "function") shellHooks.stopShardSim();
    },
    worldSystem: stageAdapters && typeof stageAdapters.getWorldSystem === "function" ? stageAdapters.getWorldSystem() : null,
    resetOrbStrokeColor: () => {
      if (shellHooks && typeof shellHooks.resetOrbStrokeColor === "function") shellHooks.resetOrbStrokeColor();
    },
    clearDeathOverlaySchedule: () => {
      if (shellHooks && typeof shellHooks.clearDeathOverlaySchedule === "function") shellHooks.clearDeathOverlaySchedule();
    },
    closeDeathOverlay: () => {
      if (shellHooks && typeof shellHooks.closeDeathOverlay === "function") shellHooks.closeDeathOverlay();
    },
    setOrbInputSuppressed: (next) => {
      if (shellHooks && typeof shellHooks.setOrbInputSuppressed === "function") shellHooks.setOrbInputSuppressed(next);
    },
    getOrbAlive: () => !!(
      runtimeContext &&
      runtimeContext.gameState &&
      runtimeContext.gameState.orb &&
      runtimeContext.gameState.orb.alive
    ),
  });

  const mvp = bootstrapStagingMvp({
    eventBus: runtime.eventBus,
    gameState: runtimeContext.gameState,
    orbSystem: runtimeContext.orbSystem,
    orbDamageVisualsRuntime: runtimeContext.orbDamageVisualsRuntime,
    audioSystem: runtimeContext.audioSystem,
    inputSystemsBundle: runtimeContext.inputSystemsBundle,
    inputSystem: runtimeContext.inputSystem,
    inputDynamicsSystem: runtimeContext.inputDynamicsSystem,
    inputGestureSystem: runtimeContext.inputGestureSystem,
    orbRuntimeState: runtime.orbRuntimeState,
    ruleSchema: shellKws.ruleSchema,
    ruleEnginePreviewSystem: shellKws.ruleEnginePreviewSystem,
    RULE_ENGINE_EXECUTE_ACTIONS: true,
    resourcesSystem: runtimeContext.resourcesSystem,
    orbFxSystem: runtimeContext.orbFxSystem,
    orbSystemsBundle: runtimeContext.orbSystemsBundle,
    orbRuntimeLoop: stageAdapters && typeof stageAdapters.getOrbRuntimeLoop === "function" ? stageAdapters.getOrbRuntimeLoop() : null,
    spellDispatchSystem: runtimeContext.spellDispatchSystem,
    kwsWordProvider: shellKws.kwsWordProvider,
    voiceProviderManager: shellKws.voiceProviderManager,
    kwsVoiceProvider: shellKws.kwsVoiceProvider,
    kwsMvpCommands: {},
    kwsBootOrchestrator: shellKws.kwsBootOrchestrator,
    grantOrbGrace: (grace) => {
      if (shellHooks && typeof shellHooks.grantOrbGrace === "function") shellHooks.grantOrbGrace(grace);
    },
    orbShatterRuntime: runtime.vfx && runtime.vfx.vfxRuntimesBundle
      ? runtime.vfx.vfxRuntimesBundle.orbShatterRuntime
      : null,
    worldSystem: stageAdapters && typeof stageAdapters.getWorldSystem === "function" ? stageAdapters.getWorldSystem() : null,
    clearDeathOverlaySchedule: () => {
      if (shellHooks && typeof shellHooks.clearDeathOverlaySchedule === "function") shellHooks.clearDeathOverlaySchedule();
    },
    closeDeathOverlay: () => {
      if (shellHooks && typeof shellHooks.closeDeathOverlay === "function") shellHooks.closeDeathOverlay();
    },
    renderOrbDamageVisuals: () => {
      if (shellHooks && typeof shellHooks.renderOrbDamageVisuals === "function") shellHooks.renderOrbDamageVisuals();
    },
    updateDebugReadout: () => {
      if (shellHooks && typeof shellHooks.updateDebugReadout === "function") shellHooks.updateDebugReadout();
    },
    setOrbInputSuppressed: (next) => {
      if (shellHooks && typeof shellHooks.setOrbInputSuppressed === "function") shellHooks.setOrbInputSuppressed(next);
    },
  });
  runtime.mvp = mvp;

  runtime.receiverHostRuntime = {
    ...receiverHostState,
    runtimeContext,
    eventBinder,
    mvp,
  };

  return {
    receiverHostRuntime: runtime.receiverHostRuntime,
    receiverHostState,
    runtimeContext,
    eventBinder,
    mvp,
    runInputFramePipelineImported,
    buildInputHudViewModel,
    INPUT_GESTURE_CFG,
    INPUT_DYNAMICS_CFG,
    applyStabilityVisuals,
  };
}
