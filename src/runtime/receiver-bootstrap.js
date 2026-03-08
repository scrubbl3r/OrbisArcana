/**
 * @typedef {Object} ReceiverInitModules
 * Named module exports loaded by `loadReceiverInitModules()`.
 * This is intentionally broad; the receiver picks only what it needs from the returned object.
 */

/**
 * Dynamically import the receiver runtime dependencies used by `game-receiver.js` startup.
 *
 * This keeps the shell bootstrap loading logic centralized and versionable.
 *
 * @returns {Promise<ReceiverInitModules>}
 */
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
    { createVoiceProviderManager },
    { createKwsProvider },
    { createOpenWakeWordBrowserBackendFactory },
    { createSpellDispatchSystem },
    { createRuleEngineV1PreviewSystem },
    { createSpellActionHandlers: createSpellActionHandlersImported },
    { createSpellCastExecutor },
    { runOrbRuntimePipeline: runOrbRuntimePipelineImported },
    { ORB_RUNTIME_CONFIG_DEFAULT },
    { ORB_STATUS_CONFIG_DEFAULT },
    { GAME_THEME_DEFAULT },
    { applyThemeCssVars },
    { buildInputHudViewModel: buildInputHudViewModelImported },
    { runInputFramePipeline: runInputFramePipelineImported },
    { BUBBLE_SHIELD_PRESET_DEFAULT, SHOCKWAVE_PRESET_DEFAULT, FLAME_AOE_PRESET_DEFAULT, ELECTRIC_AOE_PRESET_DEFAULT, hydrateReceiverVfxDefaults },
    { INPUT_GESTURE_CONFIG_DEFAULT },
    { INPUT_DYNAMICS_CONFIG_DEFAULT },
    { CAST_ACTION_REGISTRY_BY_ID },
    { RUNTIME_SPELLS_BY_ID },
    { validateSpellRuntimeRoutingV1 },
    { validateSpellSchemaIntegrityV1 },
    {
      RULE_ENGINE_V1_MASTER_CONTROL,
      validateRuleEngineV1Config,
    },
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
    import("../voice/providers/voice-provider-manager.js"),
    import("../voice/providers/kws-provider.js"),
    import("../voice/kws/openwakeword-browser-backend.js"),
    import("../systems/spell-dispatch-system.js"),
    import("../systems/rule-engine-v1-preview-system.js"),
    import("../systems/spell-action-handlers.js"),
    import("../systems/spell-cast-executor.js"),
    import("../systems/orb-runtime-pipeline.js"),
    import("../content/orb/orb-runtime-config-default.js"),
    import("../content/orb/orb-status-config-default.js"),
    import("../content/theme/game-theme-default.js"),
    import("../ui/apply-theme-css-vars.js"),
    import("../ui/build-input-hud-view-model.js"),
    import("../systems/input-frame-pipeline.js"),
    import("../vfx/presets/index.js"),
    import("../content/input/gesture-config-default.js"),
    import("../content/input/dynamics-config-default.js"),
    import("../content/spells/cast-action-registry.js"),
    import("../content/spells/runtime-spells.js"),
    import("../content/spells/validate-spell-runtime-routing-v1.js"),
    import("../content/spells/validate-spell-schema-integrity-v1.js"),
    import("../content/spell-rules/index.js"),
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
    createVoiceProviderManager,
    createKwsProvider,
    createOpenWakeWordBrowserBackendFactory,
    createSpellDispatchSystem,
    createRuleEngineV1PreviewSystem,
    createSpellActionHandlersImported,
    createSpellCastExecutor,
    runOrbRuntimePipelineImported,
    ORB_RUNTIME_CONFIG_DEFAULT,
    ORB_STATUS_CONFIG_DEFAULT,
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
    validateSpellRuntimeRoutingV1,
    validateSpellSchemaIntegrityV1,
    RULE_ENGINE_V1_MASTER_CONTROL,
    validateRuleEngineV1Config,
    WORLD_ITEMS_V1,
  };
}

/**
 * @typedef {Object} ReceiverBootstrapContext
 * @property {(theme:Object) => void} [applyRuntimeTheme]
 * @property {(fn:Function) => void} [setBuildInputHudViewModelModule]
 * @property {(fn:Function) => void} [setCreateSpellActionHandlersModule]
 * @property {(fn:Function) => void} [setRunInputFramePipelineModule]
 * @property {(fn:Function) => void} [setRunOrbRuntimePipelineModule]
 * @property {() => {PHYS:Object, SHIELD_DESCENT:Object, IMPACT_MODEL:Object, IMPACT_TH:number}} [getOrbRuntimeConfig]
 * @property {(next:{PHYS?:Object, SHIELD_DESCENT?:Object, IMPACT_MODEL?:Object, IMPACT_TH?:number}) => void} [setOrbRuntimeConfig]
 * @property {() => {FLOAT_GRACE_DEFAULT_MS:number, DOMUS_FLOAT_GRACE_MS:number, SUPER_GRACE_DEFAULT_MS:number}} [getOrbStatusConfig]
 * @property {(next:{FLOAT_GRACE_DEFAULT_MS?:number, DOMUS_FLOAT_GRACE_MS?:number, SUPER_GRACE_DEFAULT_MS?:number}) => void} [setOrbStatusConfig]
 * @property {Object} [vfxDefaults] Receiver VFX defaults object mutated by preset hydration.
 * @property {() => {INPUT_GESTURE_CFG:Object, INPUT_DYNAMICS_CFG:Object}} [getInputConfigs]
 * @property {(next:{INPUT_GESTURE_CFG?:Object, INPUT_DYNAMICS_CFG?:Object}) => void} [setInputConfigs]
 * @property {(next:{runtimeSpellIndex?:Object, castActionRegistryIndex?:Object}) => void} [setRuntimeSpellIndexes]
 * @property {(next:{signals?:Object[], windows?:Object[], events?:Object[], rules?:Object[], eventRuntimeBindings?:Object}) => void} [setRuleSchemaV1]
 * @property {() => void} [initSpellActionHandlers]
 * @property {() => Object} [createSpellCastExecutorContext]
 * @property {(executor:Object) => void} [setSpellCastExecutor]
 * @property {(ready:boolean) => void} [setReceiverModulesReady]
 */

/**
 * Apply imported module defaults/configs/presets into the receiver shell through injected setters/hooks.
 *
 * This function performs bootstrap-time hydration only; it does not create gameplay systems.
 *
 * @param {ReceiverInitModules} mods
 * @param {ReceiverBootstrapContext} [ctx]
 * @returns {void}
 */
export function hydrateReceiverBootstrapState(mods, ctx = {}) {
  const {
    GAME_THEME_DEFAULT,
    applyThemeCssVars,
    buildInputHudViewModelImported,
    createSpellActionHandlersImported,
    runInputFramePipelineImported,
    runOrbRuntimePipelineImported,
    ORB_RUNTIME_CONFIG_DEFAULT,
    ORB_STATUS_CONFIG_DEFAULT,
    hydrateReceiverVfxDefaults,
    BUBBLE_SHIELD_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    INPUT_GESTURE_CONFIG_DEFAULT,
    INPUT_DYNAMICS_CONFIG_DEFAULT,
    CAST_ACTION_REGISTRY_BY_ID,
    RUNTIME_SPELLS_BY_ID,
    validateSpellRuntimeRoutingV1,
    validateSpellSchemaIntegrityV1,
    RULE_ENGINE_V1_MASTER_CONTROL,
    validateRuleEngineV1Config,
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
    getOrbStatusConfig,
    setOrbStatusConfig,
    vfxDefaults,
    getInputConfigs,
    setInputConfigs,
    setRuntimeSpellIndexes,
    setRuleSchemaV1,
    initSpellActionHandlers,
    createSpellCastExecutorContext,
    setSpellCastExecutor,
    setReceiverModulesReady,
  } = ctx;

  const ruleSchemaV1 = (RULE_ENGINE_V1_MASTER_CONTROL && typeof RULE_ENGINE_V1_MASTER_CONTROL === "object")
    ? RULE_ENGINE_V1_MASTER_CONTROL
    : Object.freeze({
        version: "v1",
        signals: [],
        windows: [],
        events: [],
        rules: [],
        eventRuntimeBindings: Object.create(null),
      });
  const ruleEngineEnabled = (Object.prototype.hasOwnProperty.call(ruleSchemaV1, "enabled"))
    ? ruleSchemaV1.enabled !== false
    : true;
  const ruleSignalsV1 = ruleEngineEnabled && Array.isArray(ruleSchemaV1.signals)
    ? ruleSchemaV1.signals.slice()
    : [];
  const ruleWindowsV1 = ruleEngineEnabled && Array.isArray(ruleSchemaV1.windows)
    ? ruleSchemaV1.windows.slice()
    : [];
  const ruleEventsV1 = ruleEngineEnabled && Array.isArray(ruleSchemaV1.events)
    ? ruleSchemaV1.events.slice()
    : [];
  const ruleRulesV1 = ruleEngineEnabled && Array.isArray(ruleSchemaV1.rules)
    ? ruleSchemaV1.rules.slice()
    : [];
  const ruleEventRuntimeBindingsV1 = ruleEngineEnabled &&
    (ruleSchemaV1.eventRuntimeBindings && typeof ruleSchemaV1.eventRuntimeBindings === "object")
    ? { ...ruleSchemaV1.eventRuntimeBindings }
    : Object.create(null);

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

  if (ORB_STATUS_CONFIG_DEFAULT && typeof ORB_STATUS_CONFIG_DEFAULT === "object" &&
      typeof getOrbStatusConfig === "function" && typeof setOrbStatusConfig === "function") {
    const current = getOrbStatusConfig() || {};
    const fg = (ORB_STATUS_CONFIG_DEFAULT.floatGrace && typeof ORB_STATUS_CONFIG_DEFAULT.floatGrace === "object")
      ? ORB_STATUS_CONFIG_DEFAULT.floatGrace
      : {};
    setOrbStatusConfig({
      FLOAT_GRACE_DEFAULT_MS: Number.isFinite(Number(fg.defaultMs))
        ? Number(fg.defaultMs)
        : current.FLOAT_GRACE_DEFAULT_MS,
      DOMUS_FLOAT_GRACE_MS: Number.isFinite(Number(fg.domusMs))
        ? Number(fg.domusMs)
        : current.DOMUS_FLOAT_GRACE_MS,
      SUPER_GRACE_DEFAULT_MS: Number.isFinite(Number(fg.superGraceMs))
        ? Number(fg.superGraceMs)
        : current.SUPER_GRACE_DEFAULT_MS,
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

  if (typeof validateSpellRuntimeRoutingV1 === "function") {
    const routingErrors = validateSpellRuntimeRoutingV1();
    if (routingErrors.length) {
      throw new Error(`Spell runtime routing validation failed: ${routingErrors.join(" | ")}`);
    }
  }

  if (typeof validateRuleEngineV1Config === "function") {
    const errors = validateRuleEngineV1Config(ruleSchemaV1);
    if (errors.length) {
      throw new Error(`Rule Engine v1 config validation failed: ${errors.join(" | ")}`);
    }
  }
  if (typeof validateSpellSchemaIntegrityV1 === "function") {
    const integrityErrors = validateSpellSchemaIntegrityV1({
      rules: ruleRulesV1,
      events: ruleEventsV1,
      eventRuntimeBindings: ruleEventRuntimeBindingsV1,
      execution: (ruleSchemaV1.execution && typeof ruleSchemaV1.execution === "object") ? { ...ruleSchemaV1.execution } : Object.create(null),
      signalDebounceOverrides: (ruleSchemaV1.signalDebounceOverrides && typeof ruleSchemaV1.signalDebounceOverrides === "object")
        ? { ...ruleSchemaV1.signalDebounceOverrides }
        : Object.create(null),
      signalMaxMatchesOverrides: (ruleSchemaV1.signalMaxMatchesOverrides && typeof ruleSchemaV1.signalMaxMatchesOverrides === "object")
        ? { ...ruleSchemaV1.signalMaxMatchesOverrides }
        : Object.create(null),
      signalEmitPreviewMatchedOverrides: (ruleSchemaV1.signalEmitPreviewMatchedOverrides && typeof ruleSchemaV1.signalEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchemaV1.signalEmitPreviewMatchedOverrides }
        : Object.create(null),
      signalExecuteActionsOverrides: (ruleSchemaV1.signalExecuteActionsOverrides && typeof ruleSchemaV1.signalExecuteActionsOverrides === "object")
        ? { ...ruleSchemaV1.signalExecuteActionsOverrides }
        : Object.create(null),
      signalActionTypeEnabledOverrides: (ruleSchemaV1.signalActionTypeEnabledOverrides && typeof ruleSchemaV1.signalActionTypeEnabledOverrides === "object")
        ? { ...ruleSchemaV1.signalActionTypeEnabledOverrides }
        : Object.create(null),
      signalMatchWindowScaleOverrides: (ruleSchemaV1.signalMatchWindowScaleOverrides && typeof ruleSchemaV1.signalMatchWindowScaleOverrides === "object")
        ? { ...ruleSchemaV1.signalMatchWindowScaleOverrides }
        : Object.create(null),
      signalCooldownScaleOverrides: (ruleSchemaV1.signalCooldownScaleOverrides && typeof ruleSchemaV1.signalCooldownScaleOverrides === "object")
        ? { ...ruleSchemaV1.signalCooldownScaleOverrides }
        : Object.create(null),
      signalMaxActionsPerRuleMatchOverrides: (ruleSchemaV1.signalMaxActionsPerRuleMatchOverrides && typeof ruleSchemaV1.signalMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchemaV1.signalMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      signalMaxRulesEvaluatedOverrides: (ruleSchemaV1.signalMaxRulesEvaluatedOverrides && typeof ruleSchemaV1.signalMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchemaV1.signalMaxRulesEvaluatedOverrides }
        : Object.create(null),
      signalStopOnFirstMatchOverrides: (ruleSchemaV1.signalStopOnFirstMatchOverrides && typeof ruleSchemaV1.signalStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchemaV1.signalStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventEnabledOverrides: (ruleSchemaV1.sourceEventEnabledOverrides && typeof ruleSchemaV1.sourceEventEnabledOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventEnabledOverrides }
        : Object.create(null),
      sourceEventDebounceOverrides: (ruleSchemaV1.sourceEventDebounceOverrides && typeof ruleSchemaV1.sourceEventDebounceOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventDebounceOverrides }
        : Object.create(null),
      sourceEventMaxSignalsOverrides: (ruleSchemaV1.sourceEventMaxSignalsOverrides && typeof ruleSchemaV1.sourceEventMaxSignalsOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxSignalsOverrides }
        : Object.create(null),
      sourceEventMaxRulesEvaluatedOverrides: (ruleSchemaV1.sourceEventMaxRulesEvaluatedOverrides && typeof ruleSchemaV1.sourceEventMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxRulesEvaluatedOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerEventOverrides: (ruleSchemaV1.sourceEventMaxMatchesPerEventOverrides && typeof ruleSchemaV1.sourceEventMaxMatchesPerEventOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxMatchesPerEventOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerEventOverrides: (ruleSchemaV1.sourceEventMaxActionsPerEventOverrides && typeof ruleSchemaV1.sourceEventMaxActionsPerEventOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxActionsPerEventOverrides }
        : Object.create(null),
      sourceEventStopOnFirstSignalMatchOverrides: (ruleSchemaV1.sourceEventStopOnFirstSignalMatchOverrides && typeof ruleSchemaV1.sourceEventStopOnFirstSignalMatchOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventStopOnFirstSignalMatchOverrides }
        : Object.create(null),
      sourceEventEmitPreviewMatchedOverrides: (ruleSchemaV1.sourceEventEmitPreviewMatchedOverrides && typeof ruleSchemaV1.sourceEventEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventEmitPreviewMatchedOverrides }
        : Object.create(null),
      sourceEventActionTypeEnabledOverrides: (ruleSchemaV1.sourceEventActionTypeEnabledOverrides && typeof ruleSchemaV1.sourceEventActionTypeEnabledOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventActionTypeEnabledOverrides }
        : Object.create(null),
      sourceEventExecuteActionsOverrides: (ruleSchemaV1.sourceEventExecuteActionsOverrides && typeof ruleSchemaV1.sourceEventExecuteActionsOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventExecuteActionsOverrides }
        : Object.create(null),
      sourceEventCooldownScaleOverrides: (ruleSchemaV1.sourceEventCooldownScaleOverrides && typeof ruleSchemaV1.sourceEventCooldownScaleOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventCooldownScaleOverrides }
        : Object.create(null),
      sourceEventMatchWindowScaleOverrides: (ruleSchemaV1.sourceEventMatchWindowScaleOverrides && typeof ruleSchemaV1.sourceEventMatchWindowScaleOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMatchWindowScaleOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerRuleMatchOverrides: (ruleSchemaV1.sourceEventMaxActionsPerRuleMatchOverrides && typeof ruleSchemaV1.sourceEventMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      sourceEventStopOnFirstMatchOverrides: (ruleSchemaV1.sourceEventStopOnFirstMatchOverrides && typeof ruleSchemaV1.sourceEventStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerSignalOverrides: (ruleSchemaV1.sourceEventMaxMatchesPerSignalOverrides && typeof ruleSchemaV1.sourceEventMaxMatchesPerSignalOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxMatchesPerSignalOverrides }
        : Object.create(null),
      ruleActionLimitOverrides: (ruleSchemaV1.ruleActionLimitOverrides && typeof ruleSchemaV1.ruleActionLimitOverrides === "object")
        ? { ...ruleSchemaV1.ruleActionLimitOverrides }
        : Object.create(null),
      ruleCooldownScaleOverrides: (ruleSchemaV1.ruleCooldownScaleOverrides && typeof ruleSchemaV1.ruleCooldownScaleOverrides === "object")
        ? { ...ruleSchemaV1.ruleCooldownScaleOverrides }
        : Object.create(null),
      ruleMatchWindowScaleOverrides: (ruleSchemaV1.ruleMatchWindowScaleOverrides && typeof ruleSchemaV1.ruleMatchWindowScaleOverrides === "object")
        ? { ...ruleSchemaV1.ruleMatchWindowScaleOverrides }
        : Object.create(null),
      ruleEmitPreviewMatchedOverrides: (ruleSchemaV1.ruleEmitPreviewMatchedOverrides && typeof ruleSchemaV1.ruleEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchemaV1.ruleEmitPreviewMatchedOverrides }
        : Object.create(null),
      ruleExecuteActionsOverrides: (ruleSchemaV1.ruleExecuteActionsOverrides && typeof ruleSchemaV1.ruleExecuteActionsOverrides === "object")
        ? { ...ruleSchemaV1.ruleExecuteActionsOverrides }
        : Object.create(null),
      ruleActionTypeEnabledOverrides: (ruleSchemaV1.ruleActionTypeEnabledOverrides && typeof ruleSchemaV1.ruleActionTypeEnabledOverrides === "object")
        ? { ...ruleSchemaV1.ruleActionTypeEnabledOverrides }
        : Object.create(null),
      actionArgOverrides: (ruleSchemaV1.actionArgOverrides && typeof ruleSchemaV1.actionArgOverrides === "object")
        ? { ...ruleSchemaV1.actionArgOverrides }
        : Object.create(null),
    });
    if (integrityErrors.length) {
      throw new Error(`Spell schema integrity validation failed: ${integrityErrors.join(" | ")}`);
    }
  }
  if (typeof setRuleSchemaV1 === "function") {
    setRuleSchemaV1({
      signals: ruleSignalsV1,
      windows: ruleWindowsV1,
      events: ruleEventsV1,
      rules: ruleRulesV1,
      eventRuntimeBindings: ruleEventRuntimeBindingsV1,
      execution: (ruleSchemaV1.execution && typeof ruleSchemaV1.execution === "object") ? { ...ruleSchemaV1.execution } : Object.create(null),
      ruleActionLimitOverrides: (ruleSchemaV1.ruleActionLimitOverrides && typeof ruleSchemaV1.ruleActionLimitOverrides === "object")
        ? { ...ruleSchemaV1.ruleActionLimitOverrides }
        : Object.create(null),
      ruleCooldownScaleOverrides: (ruleSchemaV1.ruleCooldownScaleOverrides && typeof ruleSchemaV1.ruleCooldownScaleOverrides === "object")
        ? { ...ruleSchemaV1.ruleCooldownScaleOverrides }
        : Object.create(null),
      ruleMatchWindowScaleOverrides: (ruleSchemaV1.ruleMatchWindowScaleOverrides && typeof ruleSchemaV1.ruleMatchWindowScaleOverrides === "object")
        ? { ...ruleSchemaV1.ruleMatchWindowScaleOverrides }
        : Object.create(null),
      ruleEmitPreviewMatchedOverrides: (ruleSchemaV1.ruleEmitPreviewMatchedOverrides && typeof ruleSchemaV1.ruleEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchemaV1.ruleEmitPreviewMatchedOverrides }
        : Object.create(null),
      ruleExecuteActionsOverrides: (ruleSchemaV1.ruleExecuteActionsOverrides && typeof ruleSchemaV1.ruleExecuteActionsOverrides === "object")
        ? { ...ruleSchemaV1.ruleExecuteActionsOverrides }
        : Object.create(null),
      ruleActionTypeEnabledOverrides: (ruleSchemaV1.ruleActionTypeEnabledOverrides && typeof ruleSchemaV1.ruleActionTypeEnabledOverrides === "object")
        ? { ...ruleSchemaV1.ruleActionTypeEnabledOverrides }
        : Object.create(null),
      signalDebounceOverrides: (ruleSchemaV1.signalDebounceOverrides && typeof ruleSchemaV1.signalDebounceOverrides === "object")
        ? { ...ruleSchemaV1.signalDebounceOverrides }
        : Object.create(null),
      signalMaxMatchesOverrides: (ruleSchemaV1.signalMaxMatchesOverrides && typeof ruleSchemaV1.signalMaxMatchesOverrides === "object")
        ? { ...ruleSchemaV1.signalMaxMatchesOverrides }
        : Object.create(null),
      signalEmitPreviewMatchedOverrides: (ruleSchemaV1.signalEmitPreviewMatchedOverrides && typeof ruleSchemaV1.signalEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchemaV1.signalEmitPreviewMatchedOverrides }
        : Object.create(null),
      signalExecuteActionsOverrides: (ruleSchemaV1.signalExecuteActionsOverrides && typeof ruleSchemaV1.signalExecuteActionsOverrides === "object")
        ? { ...ruleSchemaV1.signalExecuteActionsOverrides }
        : Object.create(null),
      signalActionTypeEnabledOverrides: (ruleSchemaV1.signalActionTypeEnabledOverrides && typeof ruleSchemaV1.signalActionTypeEnabledOverrides === "object")
        ? { ...ruleSchemaV1.signalActionTypeEnabledOverrides }
        : Object.create(null),
      signalMatchWindowScaleOverrides: (ruleSchemaV1.signalMatchWindowScaleOverrides && typeof ruleSchemaV1.signalMatchWindowScaleOverrides === "object")
        ? { ...ruleSchemaV1.signalMatchWindowScaleOverrides }
        : Object.create(null),
      signalCooldownScaleOverrides: (ruleSchemaV1.signalCooldownScaleOverrides && typeof ruleSchemaV1.signalCooldownScaleOverrides === "object")
        ? { ...ruleSchemaV1.signalCooldownScaleOverrides }
        : Object.create(null),
      signalMaxActionsPerRuleMatchOverrides: (ruleSchemaV1.signalMaxActionsPerRuleMatchOverrides && typeof ruleSchemaV1.signalMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchemaV1.signalMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      signalMaxRulesEvaluatedOverrides: (ruleSchemaV1.signalMaxRulesEvaluatedOverrides && typeof ruleSchemaV1.signalMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchemaV1.signalMaxRulesEvaluatedOverrides }
        : Object.create(null),
      signalStopOnFirstMatchOverrides: (ruleSchemaV1.signalStopOnFirstMatchOverrides && typeof ruleSchemaV1.signalStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchemaV1.signalStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventEnabledOverrides: (ruleSchemaV1.sourceEventEnabledOverrides && typeof ruleSchemaV1.sourceEventEnabledOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventEnabledOverrides }
        : Object.create(null),
      sourceEventDebounceOverrides: (ruleSchemaV1.sourceEventDebounceOverrides && typeof ruleSchemaV1.sourceEventDebounceOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventDebounceOverrides }
        : Object.create(null),
      sourceEventMaxSignalsOverrides: (ruleSchemaV1.sourceEventMaxSignalsOverrides && typeof ruleSchemaV1.sourceEventMaxSignalsOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxSignalsOverrides }
        : Object.create(null),
      sourceEventMaxRulesEvaluatedOverrides: (ruleSchemaV1.sourceEventMaxRulesEvaluatedOverrides && typeof ruleSchemaV1.sourceEventMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxRulesEvaluatedOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerEventOverrides: (ruleSchemaV1.sourceEventMaxMatchesPerEventOverrides && typeof ruleSchemaV1.sourceEventMaxMatchesPerEventOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxMatchesPerEventOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerEventOverrides: (ruleSchemaV1.sourceEventMaxActionsPerEventOverrides && typeof ruleSchemaV1.sourceEventMaxActionsPerEventOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxActionsPerEventOverrides }
        : Object.create(null),
      sourceEventStopOnFirstSignalMatchOverrides: (ruleSchemaV1.sourceEventStopOnFirstSignalMatchOverrides && typeof ruleSchemaV1.sourceEventStopOnFirstSignalMatchOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventStopOnFirstSignalMatchOverrides }
        : Object.create(null),
      sourceEventEmitPreviewMatchedOverrides: (ruleSchemaV1.sourceEventEmitPreviewMatchedOverrides && typeof ruleSchemaV1.sourceEventEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventEmitPreviewMatchedOverrides }
        : Object.create(null),
      sourceEventActionTypeEnabledOverrides: (ruleSchemaV1.sourceEventActionTypeEnabledOverrides && typeof ruleSchemaV1.sourceEventActionTypeEnabledOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventActionTypeEnabledOverrides }
        : Object.create(null),
      sourceEventExecuteActionsOverrides: (ruleSchemaV1.sourceEventExecuteActionsOverrides && typeof ruleSchemaV1.sourceEventExecuteActionsOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventExecuteActionsOverrides }
        : Object.create(null),
      sourceEventCooldownScaleOverrides: (ruleSchemaV1.sourceEventCooldownScaleOverrides && typeof ruleSchemaV1.sourceEventCooldownScaleOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventCooldownScaleOverrides }
        : Object.create(null),
      sourceEventMatchWindowScaleOverrides: (ruleSchemaV1.sourceEventMatchWindowScaleOverrides && typeof ruleSchemaV1.sourceEventMatchWindowScaleOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMatchWindowScaleOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerRuleMatchOverrides: (ruleSchemaV1.sourceEventMaxActionsPerRuleMatchOverrides && typeof ruleSchemaV1.sourceEventMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      sourceEventStopOnFirstMatchOverrides: (ruleSchemaV1.sourceEventStopOnFirstMatchOverrides && typeof ruleSchemaV1.sourceEventStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerSignalOverrides: (ruleSchemaV1.sourceEventMaxMatchesPerSignalOverrides && typeof ruleSchemaV1.sourceEventMaxMatchesPerSignalOverrides === "object")
        ? { ...ruleSchemaV1.sourceEventMaxMatchesPerSignalOverrides }
        : Object.create(null),
      actionArgOverrides: (ruleSchemaV1.actionArgOverrides && typeof ruleSchemaV1.actionArgOverrides === "object")
        ? { ...ruleSchemaV1.actionArgOverrides }
        : Object.create(null),
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
