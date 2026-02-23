export async function loadReceiverInitModules() {
  const [
    { createEventBus },
    { createGameState },
    { createOrbSystem },
    { createFxSystem },
    { createAudioSystem },
    { createInputSystemsBundle },
    { createWorldSystem },
    { createResourcesSystem },
    { createOrbSystemsBundle },
    { createOrbFxSystem },
    { createVoiceRecognitionSystem },
    { createSpellDispatchSystem },
    { createVoiceHudSystem },
    { createSpellActionHandlers: createSpellActionHandlersImported },
    { createSpellCastExecutor },
    { runOrbRuntimePipeline: runOrbRuntimePipelineImported },
    { ORB_RUNTIME_CONFIG_DEFAULT },
    { GAME_THEME_DEFAULT },
    { applyThemeCssVars },
    { buildInputHudViewModel: buildInputHudViewModelImported },
    { runInputFramePipeline: runInputFramePipelineImported },
    { BUBBLE_SHIELD_PRESET_DEFAULT, SHOCKWAVE_PRESET_DEFAULT, FLAME_AOE_PRESET_DEFAULT, ELECTRIC_AOE_PRESET_DEFAULT, hydrateReceiverVfxDefaults },
    { INPUT_GESTURE_CONFIG_DEFAULT },
    { INPUT_DYNAMICS_CONFIG_DEFAULT },
    { CAST_ACTION_REGISTRY_BY_ID },
    { RUNTIME_SPELLS_BY_ID },
    { WORLD_ITEMS_V1 },
  ] = await Promise.all([
    import("../events/event-bus.js"),
    import("../state/game-state.js"),
    import("../systems/orb-system.js"),
    import("../systems/fx-system.js"),
    import("../systems/audio-system.js"),
    import("../systems/input-systems-bundle.js"),
    import("../systems/world-system.js"),
    import("../systems/resources-system.js"),
    import("../systems/orb-systems-bundle.js"),
    import("../systems/orb-fx-system.js"),
    import("../systems/voice-recognition-system.js"),
    import("../systems/spell-dispatch-system.js"),
    import("../systems/voice-hud-system.js"),
    import("../systems/spell-action-handlers.js"),
    import("../systems/spell-cast-executor.js"),
    import("../systems/orb-runtime-pipeline.js"),
    import("../content/orb/orb-runtime-config-default.js"),
    import("../content/theme/game-theme-default.js"),
    import("../ui/apply-theme-css-vars.js"),
    import("../ui/build-input-hud-view-model.js"),
    import("../systems/input-frame-pipeline.js"),
    import("../vfx/presets/index.js"),
    import("../content/input/gesture-config-default.js"),
    import("../content/input/dynamics-config-default.js"),
    import("../content/spells/cast-action-registry.js"),
    import("../content/spells/runtime-spells.js"),
    import("../content/world-items/default-world-items.js"),
  ]);

  return {
    createEventBus,
    createGameState,
    createOrbSystem,
    createFxSystem,
    createAudioSystem,
    createInputSystemsBundle,
    createWorldSystem,
    createResourcesSystem,
    createOrbSystemsBundle,
    createOrbFxSystem,
    createVoiceRecognitionSystem,
    createSpellDispatchSystem,
    createVoiceHudSystem,
    createSpellActionHandlersImported,
    createSpellCastExecutor,
    runOrbRuntimePipelineImported,
    ORB_RUNTIME_CONFIG_DEFAULT,
    GAME_THEME_DEFAULT,
    applyThemeCssVars,
    buildInputHudViewModelImported,
    runInputFramePipelineImported,
    BUBBLE_SHIELD_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    hydrateReceiverVfxDefaults,
    INPUT_GESTURE_CONFIG_DEFAULT,
    INPUT_DYNAMICS_CONFIG_DEFAULT,
    CAST_ACTION_REGISTRY_BY_ID,
    RUNTIME_SPELLS_BY_ID,
    WORLD_ITEMS_V1,
  };
}

export function hydrateReceiverBootstrapState(mods, ctx = {}) {
  const {
    GAME_THEME_DEFAULT,
    applyThemeCssVars,
    buildInputHudViewModelImported,
    createSpellActionHandlersImported,
    runInputFramePipelineImported,
    runOrbRuntimePipelineImported,
    ORB_RUNTIME_CONFIG_DEFAULT,
    hydrateReceiverVfxDefaults,
    BUBBLE_SHIELD_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    INPUT_GESTURE_CONFIG_DEFAULT,
    INPUT_DYNAMICS_CONFIG_DEFAULT,
    CAST_ACTION_REGISTRY_BY_ID,
    RUNTIME_SPELLS_BY_ID,
    createSpellCastExecutor,
  } = mods || {};

  const {
    applyRuntimeTheme,
    setBuildInputHudViewModelModule,
    setCreateSpellActionHandlersModule,
    setRunInputFramePipelineModule,
    setRunOrbRuntimePipelineModule,
    getOrbRuntimeConfig,
    setOrbRuntimeConfig,
    vfxDefaults,
    getInputConfigs,
    setInputConfigs,
    setRuntimeSpellIndexes,
    initSpellActionHandlers,
    createSpellCastExecutorContext,
    setSpellCastExecutor,
    setReceiverModulesReady,
  } = ctx;

  if (GAME_THEME_DEFAULT) {
    if (typeof applyThemeCssVars === "function") applyThemeCssVars(GAME_THEME_DEFAULT);
    if (typeof applyRuntimeTheme === "function") applyRuntimeTheme(GAME_THEME_DEFAULT);
  }

  if (typeof setBuildInputHudViewModelModule === "function" && typeof buildInputHudViewModelImported === "function") {
    setBuildInputHudViewModelModule(buildInputHudViewModelImported);
  }
  if (typeof setCreateSpellActionHandlersModule === "function" && typeof createSpellActionHandlersImported === "function") {
    setCreateSpellActionHandlersModule(createSpellActionHandlersImported);
  }
  if (typeof setRunInputFramePipelineModule === "function" && typeof runInputFramePipelineImported === "function") {
    setRunInputFramePipelineModule(runInputFramePipelineImported);
  }
  if (typeof setRunOrbRuntimePipelineModule === "function" && typeof runOrbRuntimePipelineImported === "function") {
    setRunOrbRuntimePipelineModule(runOrbRuntimePipelineImported);
  }

  if (ORB_RUNTIME_CONFIG_DEFAULT && typeof ORB_RUNTIME_CONFIG_DEFAULT === "object" &&
      typeof getOrbRuntimeConfig === "function" && typeof setOrbRuntimeConfig === "function") {
    const current = getOrbRuntimeConfig() || {};
    const cfg = ORB_RUNTIME_CONFIG_DEFAULT;
    setOrbRuntimeConfig({
      PHYS: (cfg.physics && typeof cfg.physics === "object") ? { ...(current.PHYS || {}), ...cfg.physics } : current.PHYS,
      SHIELD_DESCENT: (cfg.shieldDescent && typeof cfg.shieldDescent === "object") ? { ...(current.SHIELD_DESCENT || {}), ...cfg.shieldDescent } : current.SHIELD_DESCENT,
      IMPACT_MODEL: (cfg.impact && cfg.impact.model && typeof cfg.impact.model === "object") ? { ...(current.IMPACT_MODEL || {}), ...cfg.impact.model } : current.IMPACT_MODEL,
      IMPACT_TH: (cfg.impact && Number.isFinite(Number(cfg.impact.threshold))) ? Number(cfg.impact.threshold) : current.IMPACT_TH,
    });
  }

  if (typeof hydrateReceiverVfxDefaults === "function" && vfxDefaults) {
    hydrateReceiverVfxDefaults(vfxDefaults, {
      bubbleShield: BUBBLE_SHIELD_PRESET_DEFAULT,
      shockwave: SHOCKWAVE_PRESET_DEFAULT,
      flameAoe: FLAME_AOE_PRESET_DEFAULT,
      electricAoe: ELECTRIC_AOE_PRESET_DEFAULT,
    });
  }

  if ((INPUT_GESTURE_CONFIG_DEFAULT && typeof INPUT_GESTURE_CONFIG_DEFAULT === "object") ||
      (INPUT_DYNAMICS_CONFIG_DEFAULT && typeof INPUT_DYNAMICS_CONFIG_DEFAULT === "object")) {
    const currentInputCfg = (typeof getInputConfigs === "function" ? getInputConfigs() : {}) || {};
    if (typeof setInputConfigs === "function") {
      setInputConfigs({
        INPUT_GESTURE_CFG: (INPUT_GESTURE_CONFIG_DEFAULT && typeof INPUT_GESTURE_CONFIG_DEFAULT === "object")
          ? INPUT_GESTURE_CONFIG_DEFAULT
          : currentInputCfg.INPUT_GESTURE_CFG,
        INPUT_DYNAMICS_CFG: (INPUT_DYNAMICS_CONFIG_DEFAULT && typeof INPUT_DYNAMICS_CONFIG_DEFAULT === "object")
          ? INPUT_DYNAMICS_CONFIG_DEFAULT
          : currentInputCfg.INPUT_DYNAMICS_CFG,
      });
    }
  }

  if (typeof setRuntimeSpellIndexes === "function") {
    setRuntimeSpellIndexes({
      runtimeSpellIndex: RUNTIME_SPELLS_BY_ID || Object.create(null),
      castActionRegistryIndex: CAST_ACTION_REGISTRY_BY_ID || Object.create(null),
    });
  }

  if (typeof initSpellActionHandlers === "function") {
    initSpellActionHandlers();
  }

  if (typeof createSpellCastExecutor === "function" &&
      typeof createSpellCastExecutorContext === "function" &&
      typeof setSpellCastExecutor === "function") {
    setSpellCastExecutor(createSpellCastExecutor(createSpellCastExecutorContext()));
  }

  if (typeof setReceiverModulesReady === "function") {
    setReceiverModulesReady(true);
  }
}

