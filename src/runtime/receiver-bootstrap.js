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
    { createRuleEnginePreviewSystem },
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
    { validateSpellRuntimeRouting },
    { validateSpellSchemaIntegrity },
    {
      RULE_ENGINE_MASTER_CONTROL,
      validateRuleEngineConfig,
    },
    {
      INTERACTIONS_V2,
      INTERACTIONS_V2_BOOTSTRAP,
      buildRuleEngineFromInteractionsV2,
      validateSpellbookV2,
    },
    { WORLD_ITEMS },
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
    import("../systems/rule-engine-preview-system.js"),
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
    import("../content/spells/validate-spell-runtime-routing.js"),
    import("../content/spells/validate-spell-schema-integrity.js"),
    import("../content/spell-rules/index.js"),
    import("../content/interactions-v2/index.js"),
    import("../content/world-items/default-world-items.js"),
  ]);

  const worldItemsResolved = Array.isArray(WORLD_ITEMS) ? WORLD_ITEMS : [];
  const ruleEngineExports = {
    createRuleEnginePreviewSystem,
    RULE_ENGINE_MASTER_CONTROL,
    validateRuleEngineConfig,
    buildRuleEngineFromInteractionsV2,
  };
  const ruleEngineLegacyAliasExports = {
    createRuleEngineV1PreviewSystem: ruleEngineExports.createRuleEnginePreviewSystem,
    RULE_ENGINE_V1_MASTER_CONTROL: ruleEngineExports.RULE_ENGINE_MASTER_CONTROL,
    validateRuleEngineV1Config: ruleEngineExports.validateRuleEngineConfig,
    buildRuleEngineV1FromInteractionsV2: ruleEngineExports.buildRuleEngineFromInteractionsV2,
  };
  const worldItemExports = {
    WORLD_ITEMS: worldItemsResolved,
    WORLD_ITEMS_V1: worldItemsResolved,
  };

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
    ...ruleEngineExports,
    ...ruleEngineLegacyAliasExports,
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
    validateSpellRuntimeRouting,
    validateSpellSchemaIntegrity,
    INTERACTIONS_V2,
    INTERACTIONS_V2_BOOTSTRAP,
    validateSpellbookV2,
    ...worldItemExports,
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
 * @property {(next:{source?:string, signals?:Object[], windows?:Object[], events?:Object[], rules?:Object[], eventRuntimeBindings?:Object}) => void} [setRuleSchema]
 * @property {(next:{source?:string, signals?:Object[], windows?:Object[], events?:Object[], rules?:Object[], eventRuntimeBindings?:Object}) => void} [setRuleSchemaV1] Legacy alias of setRuleSchema.
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
    validateSpellRuntimeRouting,
    validateSpellSchemaIntegrity,
    RULE_ENGINE_MASTER_CONTROL,
    validateRuleEngineConfig,
    INTERACTIONS_V2,
    INTERACTIONS_V2_BOOTSTRAP,
    buildRuleEngineFromInteractionsV2,
    validateSpellbookV2,
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
    setRuleSchema,
    setRuleSchemaV1: setRuleSchemaAlias,
    initSpellActionHandlers,
    createSpellCastExecutorContext,
    setSpellCastExecutor,
    setReceiverModulesReady,
  } = ctx;

  function buildSafeDisabledRuleSchema() {
    return Object.freeze({
      id: "rule_engine_safe_disabled",
      version: "1",
      enabled: false,
      signals: Object.freeze([]),
      windows: Object.freeze([]),
      events: Object.freeze([]),
      rules: Object.freeze([]),
      eventRuntimeBindings: Object.freeze({}),
      execution: Object.freeze({}),
    });
  }

  const ruleEngineMasterControl = (RULE_ENGINE_MASTER_CONTROL && typeof RULE_ENGINE_MASTER_CONTROL === "object")
    ? RULE_ENGINE_MASTER_CONTROL
    : Object.create(null);
  const validateRuleEngine = (typeof validateRuleEngineConfig === "function")
    ? validateRuleEngineConfig
    : (() => []);
  const validateSpellRuntimeRoutingFn = validateSpellRuntimeRouting;
  const validateSpellSchemaIntegrityFn = validateSpellSchemaIntegrity;
  const buildRuleEngineFromInteractions = (typeof buildRuleEngineFromInteractionsV2 === "function")
    ? buildRuleEngineFromInteractionsV2
    : null;
  const setRuleSchemaRuntime = (typeof setRuleSchema === "function")
    ? setRuleSchema
    : setRuleSchemaAlias;

  const fallbackRuleSchema = (ruleEngineMasterControl && typeof ruleEngineMasterControl === "object")
    ? ruleEngineMasterControl
    : Object.freeze({
        version: "1",
        signals: [],
        windows: [],
        events: [],
        rules: [],
        eventRuntimeBindings: Object.create(null),
      });
  const useInteractionsV2 = !!(INTERACTIONS_V2_BOOTSTRAP &&
    typeof INTERACTIONS_V2_BOOTSTRAP === "object" &&
    INTERACTIONS_V2_BOOTSTRAP.useInReceiverBootstrap === true);
  let adapterFallbackUsed = false;
  let ruleSchema = fallbackRuleSchema;
  if (useInteractionsV2 && typeof buildRuleEngineFromInteractions === "function") {
    try {
      ruleSchema = buildRuleEngineFromInteractions({
        interactionsV2: INTERACTIONS_V2,
        baseRuleEngine: fallbackRuleSchema,
      });
    } catch (err) {
      try {
        console.warn("[receiver-bootstrap] INTERACTIONS_V2 adapter failed; falling back to RULE_ENGINE_MASTER_CONTROL", err);
      } catch (_) {}
      adapterFallbackUsed = true;
      ruleSchema = fallbackRuleSchema;
    }
  }
  let ruleEngineEnabled = (Object.prototype.hasOwnProperty.call(ruleSchema, "enabled"))
    ? ruleSchema.enabled !== false
    : true;
  let ruleSignals = ruleEngineEnabled && Array.isArray(ruleSchema.signals)
    ? ruleSchema.signals.slice()
    : [];
  let ruleWindows = ruleEngineEnabled && Array.isArray(ruleSchema.windows)
    ? ruleSchema.windows.slice()
    : [];
  let ruleEvents = ruleEngineEnabled && Array.isArray(ruleSchema.events)
    ? ruleSchema.events.slice()
    : [];
  let ruleRules = ruleEngineEnabled && Array.isArray(ruleSchema.rules)
    ? ruleSchema.rules.slice()
    : [];
  let ruleEventRuntimeBindings = ruleEngineEnabled &&
    (ruleSchema.eventRuntimeBindings && typeof ruleSchema.eventRuntimeBindings === "object")
    ? { ...ruleSchema.eventRuntimeBindings }
    : Object.create(null);

  function refreshRuleSchemaDerived() {
    ruleEngineEnabled = (Object.prototype.hasOwnProperty.call(ruleSchema, "enabled"))
      ? ruleSchema.enabled !== false
      : true;
    ruleSignals = ruleEngineEnabled && Array.isArray(ruleSchema.signals)
      ? ruleSchema.signals.slice()
      : [];
    ruleWindows = ruleEngineEnabled && Array.isArray(ruleSchema.windows)
      ? ruleSchema.windows.slice()
      : [];
    ruleEvents = ruleEngineEnabled && Array.isArray(ruleSchema.events)
      ? ruleSchema.events.slice()
      : [];
    ruleRules = ruleEngineEnabled && Array.isArray(ruleSchema.rules)
      ? ruleSchema.rules.slice()
      : [];
    ruleEventRuntimeBindings = ruleEngineEnabled &&
      (ruleSchema.eventRuntimeBindings && typeof ruleSchema.eventRuntimeBindings === "object")
      ? { ...ruleSchema.eventRuntimeBindings }
      : Object.create(null);
  }

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

  if (typeof validateSpellRuntimeRoutingFn === "function") {
    if (typeof validateSpellbookV2 === "function") {
      const spellbookErrors = validateSpellbookV2();
      if (spellbookErrors.length) {
        throw new Error(`Spellbook v2 validation failed: ${spellbookErrors.join(" | ")}`);
      }
    }
    const routingErrors = validateSpellRuntimeRoutingFn();
    if (routingErrors.length) {
      throw new Error(`Spell runtime routing validation failed: ${routingErrors.join(" | ")}`);
    }
  }

  if (typeof validateRuleEngine === "function") {
    const errors = validateRuleEngine(ruleSchema);
    if (errors.length) {
      try {
        console.warn(
          `[receiver-bootstrap] rule schema invalid; using safe disabled fallback (${errors.length} errors)`
        );
      } catch (_) {}
      adapterFallbackUsed = true;
      ruleSchema = buildSafeDisabledRuleSchema();
      refreshRuleSchemaDerived();
    }
  }
  if (typeof validateSpellSchemaIntegrityFn === "function") {
    const integrityErrors = validateSpellSchemaIntegrityFn({
      rules: ruleRules,
      events: ruleEvents,
      eventRuntimeBindings: ruleEventRuntimeBindings,
      execution: (ruleSchema.execution && typeof ruleSchema.execution === "object") ? { ...ruleSchema.execution } : Object.create(null),
      signalDebounceOverrides: (ruleSchema.signalDebounceOverrides && typeof ruleSchema.signalDebounceOverrides === "object")
        ? { ...ruleSchema.signalDebounceOverrides }
        : Object.create(null),
      signalMaxMatchesOverrides: (ruleSchema.signalMaxMatchesOverrides && typeof ruleSchema.signalMaxMatchesOverrides === "object")
        ? { ...ruleSchema.signalMaxMatchesOverrides }
        : Object.create(null),
      signalEmitPreviewMatchedOverrides: (ruleSchema.signalEmitPreviewMatchedOverrides && typeof ruleSchema.signalEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchema.signalEmitPreviewMatchedOverrides }
        : Object.create(null),
      signalExecuteActionsOverrides: (ruleSchema.signalExecuteActionsOverrides && typeof ruleSchema.signalExecuteActionsOverrides === "object")
        ? { ...ruleSchema.signalExecuteActionsOverrides }
        : Object.create(null),
      signalEmitActionExecutedOverrides: (ruleSchema.signalEmitActionExecutedOverrides && typeof ruleSchema.signalEmitActionExecutedOverrides === "object")
        ? { ...ruleSchema.signalEmitActionExecutedOverrides }
        : Object.create(null),
      signalEmitSourceEventSummaryOverrides: (ruleSchema.signalEmitSourceEventSummaryOverrides && typeof ruleSchema.signalEmitSourceEventSummaryOverrides === "object")
        ? { ...ruleSchema.signalEmitSourceEventSummaryOverrides }
        : Object.create(null),
      signalSummaryIncludeSignalAndRuleIdsOverrides: (ruleSchema.signalSummaryIncludeSignalAndRuleIdsOverrides && typeof ruleSchema.signalSummaryIncludeSignalAndRuleIdsOverrides === "object")
        ? { ...ruleSchema.signalSummaryIncludeSignalAndRuleIdsOverrides }
        : Object.create(null),
      signalSummaryIncludeBudgetCapsOverrides: (ruleSchema.signalSummaryIncludeBudgetCapsOverrides && typeof ruleSchema.signalSummaryIncludeBudgetCapsOverrides === "object")
        ? { ...ruleSchema.signalSummaryIncludeBudgetCapsOverrides }
        : Object.create(null),
      signalActionExecutedEventTypeEnabledOverrides: (ruleSchema.signalActionExecutedEventTypeEnabledOverrides && typeof ruleSchema.signalActionExecutedEventTypeEnabledOverrides === "object")
        ? { ...ruleSchema.signalActionExecutedEventTypeEnabledOverrides }
        : Object.create(null),
      signalActionTypeEnabledOverrides: (ruleSchema.signalActionTypeEnabledOverrides && typeof ruleSchema.signalActionTypeEnabledOverrides === "object")
        ? { ...ruleSchema.signalActionTypeEnabledOverrides }
        : Object.create(null),
      signalMatchWindowScaleOverrides: (ruleSchema.signalMatchWindowScaleOverrides && typeof ruleSchema.signalMatchWindowScaleOverrides === "object")
        ? { ...ruleSchema.signalMatchWindowScaleOverrides }
        : Object.create(null),
      signalCooldownScaleOverrides: (ruleSchema.signalCooldownScaleOverrides && typeof ruleSchema.signalCooldownScaleOverrides === "object")
        ? { ...ruleSchema.signalCooldownScaleOverrides }
        : Object.create(null),
      signalMaxActionsPerRuleMatchOverrides: (ruleSchema.signalMaxActionsPerRuleMatchOverrides && typeof ruleSchema.signalMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchema.signalMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      signalMaxRulesEvaluatedOverrides: (ruleSchema.signalMaxRulesEvaluatedOverrides && typeof ruleSchema.signalMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchema.signalMaxRulesEvaluatedOverrides }
        : Object.create(null),
      signalMaxActionsPerEventOverrides: (ruleSchema.signalMaxActionsPerEventOverrides && typeof ruleSchema.signalMaxActionsPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxActionsPerEventOverrides }
        : Object.create(null),
      signalMaxActionsPerSignalOverrides: (ruleSchema.signalMaxActionsPerSignalOverrides && typeof ruleSchema.signalMaxActionsPerSignalOverrides === "object")
        ? { ...ruleSchema.signalMaxActionsPerSignalOverrides }
        : Object.create(null),
      signalMaxMatchesPerEventOverrides: (ruleSchema.signalMaxMatchesPerEventOverrides && typeof ruleSchema.signalMaxMatchesPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxMatchesPerEventOverrides }
        : Object.create(null),
      signalMaxSignalsPerEventOverrides: (ruleSchema.signalMaxSignalsPerEventOverrides && typeof ruleSchema.signalMaxSignalsPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxSignalsPerEventOverrides }
        : Object.create(null),
      signalMaxSignalsEvaluatedPerEventOverrides: (ruleSchema.signalMaxSignalsEvaluatedPerEventOverrides && typeof ruleSchema.signalMaxSignalsEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxSignalsEvaluatedPerEventOverrides }
        : Object.create(null),
      signalMaxRulesEvaluatedPerEventOverrides: (ruleSchema.signalMaxRulesEvaluatedPerEventOverrides && typeof ruleSchema.signalMaxRulesEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxRulesEvaluatedPerEventOverrides }
        : Object.create(null),
      signalStopOnFirstSignalMatchPerEventOverrides: (ruleSchema.signalStopOnFirstSignalMatchPerEventOverrides && typeof ruleSchema.signalStopOnFirstSignalMatchPerEventOverrides === "object")
        ? { ...ruleSchema.signalStopOnFirstSignalMatchPerEventOverrides }
        : Object.create(null),
      signalStopOnFirstMatchOverrides: (ruleSchema.signalStopOnFirstMatchOverrides && typeof ruleSchema.signalStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchema.signalStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventEnabledOverrides: (ruleSchema.sourceEventEnabledOverrides && typeof ruleSchema.sourceEventEnabledOverrides === "object")
        ? { ...ruleSchema.sourceEventEnabledOverrides }
        : Object.create(null),
      sourceEventDebounceOverrides: (ruleSchema.sourceEventDebounceOverrides && typeof ruleSchema.sourceEventDebounceOverrides === "object")
        ? { ...ruleSchema.sourceEventDebounceOverrides }
        : Object.create(null),
      sourceEventMaxSignalsOverrides: (ruleSchema.sourceEventMaxSignalsOverrides && typeof ruleSchema.sourceEventMaxSignalsOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxSignalsOverrides }
        : Object.create(null),
      sourceEventMaxSignalsEvaluatedPerEventOverrides: (ruleSchema.sourceEventMaxSignalsEvaluatedPerEventOverrides && typeof ruleSchema.sourceEventMaxSignalsEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxSignalsEvaluatedPerEventOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerSignalOverrides: (ruleSchema.sourceEventMaxActionsPerSignalOverrides && typeof ruleSchema.sourceEventMaxActionsPerSignalOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxActionsPerSignalOverrides }
        : Object.create(null),
      sourceEventMaxRulesEvaluatedOverrides: (ruleSchema.sourceEventMaxRulesEvaluatedOverrides && typeof ruleSchema.sourceEventMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxRulesEvaluatedOverrides }
        : Object.create(null),
      sourceEventMaxRulesEvaluatedPerEventOverrides: (ruleSchema.sourceEventMaxRulesEvaluatedPerEventOverrides && typeof ruleSchema.sourceEventMaxRulesEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxRulesEvaluatedPerEventOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerEventOverrides: (ruleSchema.sourceEventMaxMatchesPerEventOverrides && typeof ruleSchema.sourceEventMaxMatchesPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxMatchesPerEventOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerEventOverrides: (ruleSchema.sourceEventMaxActionsPerEventOverrides && typeof ruleSchema.sourceEventMaxActionsPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxActionsPerEventOverrides }
        : Object.create(null),
      sourceEventStopOnFirstSignalMatchOverrides: (ruleSchema.sourceEventStopOnFirstSignalMatchOverrides && typeof ruleSchema.sourceEventStopOnFirstSignalMatchOverrides === "object")
        ? { ...ruleSchema.sourceEventStopOnFirstSignalMatchOverrides }
        : Object.create(null),
      sourceEventEmitPreviewMatchedOverrides: (ruleSchema.sourceEventEmitPreviewMatchedOverrides && typeof ruleSchema.sourceEventEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchema.sourceEventEmitPreviewMatchedOverrides }
        : Object.create(null),
      sourceEventEmitActionExecutedOverrides: (ruleSchema.sourceEventEmitActionExecutedOverrides && typeof ruleSchema.sourceEventEmitActionExecutedOverrides === "object")
        ? { ...ruleSchema.sourceEventEmitActionExecutedOverrides }
        : Object.create(null),
      sourceEventEmitSourceEventSummaryOverrides: (ruleSchema.sourceEventEmitSourceEventSummaryOverrides && typeof ruleSchema.sourceEventEmitSourceEventSummaryOverrides === "object")
        ? { ...ruleSchema.sourceEventEmitSourceEventSummaryOverrides }
        : Object.create(null),
      sourceEventSummaryIncludeSignalAndRuleIdsOverrides: (ruleSchema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides && typeof ruleSchema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides === "object")
        ? { ...ruleSchema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides }
        : Object.create(null),
      sourceEventSummaryIncludeBudgetCapsOverrides: (ruleSchema.sourceEventSummaryIncludeBudgetCapsOverrides && typeof ruleSchema.sourceEventSummaryIncludeBudgetCapsOverrides === "object")
        ? { ...ruleSchema.sourceEventSummaryIncludeBudgetCapsOverrides }
        : Object.create(null),
      sourceEventActionTypeEnabledOverrides: (ruleSchema.sourceEventActionTypeEnabledOverrides && typeof ruleSchema.sourceEventActionTypeEnabledOverrides === "object")
        ? { ...ruleSchema.sourceEventActionTypeEnabledOverrides }
        : Object.create(null),
      sourceEventActionExecutedEventTypeEnabledOverrides: (ruleSchema.sourceEventActionExecutedEventTypeEnabledOverrides && typeof ruleSchema.sourceEventActionExecutedEventTypeEnabledOverrides === "object")
        ? { ...ruleSchema.sourceEventActionExecutedEventTypeEnabledOverrides }
        : Object.create(null),
      sourceEventExecuteActionsOverrides: (ruleSchema.sourceEventExecuteActionsOverrides && typeof ruleSchema.sourceEventExecuteActionsOverrides === "object")
        ? { ...ruleSchema.sourceEventExecuteActionsOverrides }
        : Object.create(null),
      sourceEventCooldownScaleOverrides: (ruleSchema.sourceEventCooldownScaleOverrides && typeof ruleSchema.sourceEventCooldownScaleOverrides === "object")
        ? { ...ruleSchema.sourceEventCooldownScaleOverrides }
        : Object.create(null),
      sourceEventMatchWindowScaleOverrides: (ruleSchema.sourceEventMatchWindowScaleOverrides && typeof ruleSchema.sourceEventMatchWindowScaleOverrides === "object")
        ? { ...ruleSchema.sourceEventMatchWindowScaleOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerRuleMatchOverrides: (ruleSchema.sourceEventMaxActionsPerRuleMatchOverrides && typeof ruleSchema.sourceEventMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      sourceEventStopOnFirstMatchOverrides: (ruleSchema.sourceEventStopOnFirstMatchOverrides && typeof ruleSchema.sourceEventStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchema.sourceEventStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerSignalOverrides: (ruleSchema.sourceEventMaxMatchesPerSignalOverrides && typeof ruleSchema.sourceEventMaxMatchesPerSignalOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxMatchesPerSignalOverrides }
        : Object.create(null),
      ruleActionLimitOverrides: (ruleSchema.ruleActionLimitOverrides && typeof ruleSchema.ruleActionLimitOverrides === "object")
        ? { ...ruleSchema.ruleActionLimitOverrides }
        : Object.create(null),
      ruleCooldownScaleOverrides: (ruleSchema.ruleCooldownScaleOverrides && typeof ruleSchema.ruleCooldownScaleOverrides === "object")
        ? { ...ruleSchema.ruleCooldownScaleOverrides }
        : Object.create(null),
      ruleMatchWindowScaleOverrides: (ruleSchema.ruleMatchWindowScaleOverrides && typeof ruleSchema.ruleMatchWindowScaleOverrides === "object")
        ? { ...ruleSchema.ruleMatchWindowScaleOverrides }
        : Object.create(null),
      ruleEmitPreviewMatchedOverrides: (ruleSchema.ruleEmitPreviewMatchedOverrides && typeof ruleSchema.ruleEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchema.ruleEmitPreviewMatchedOverrides }
        : Object.create(null),
      ruleEmitActionExecutedOverrides: (ruleSchema.ruleEmitActionExecutedOverrides && typeof ruleSchema.ruleEmitActionExecutedOverrides === "object")
        ? { ...ruleSchema.ruleEmitActionExecutedOverrides }
        : Object.create(null),
      ruleEmitSourceEventSummaryOverrides: (ruleSchema.ruleEmitSourceEventSummaryOverrides && typeof ruleSchema.ruleEmitSourceEventSummaryOverrides === "object")
        ? { ...ruleSchema.ruleEmitSourceEventSummaryOverrides }
        : Object.create(null),
      ruleSummaryIncludeSignalAndRuleIdsOverrides: (ruleSchema.ruleSummaryIncludeSignalAndRuleIdsOverrides && typeof ruleSchema.ruleSummaryIncludeSignalAndRuleIdsOverrides === "object")
        ? { ...ruleSchema.ruleSummaryIncludeSignalAndRuleIdsOverrides }
        : Object.create(null),
      ruleSummaryIncludeBudgetCapsOverrides: (ruleSchema.ruleSummaryIncludeBudgetCapsOverrides && typeof ruleSchema.ruleSummaryIncludeBudgetCapsOverrides === "object")
        ? { ...ruleSchema.ruleSummaryIncludeBudgetCapsOverrides }
        : Object.create(null),
      ruleActionExecutedEventTypeEnabledOverrides: (ruleSchema.ruleActionExecutedEventTypeEnabledOverrides && typeof ruleSchema.ruleActionExecutedEventTypeEnabledOverrides === "object")
        ? { ...ruleSchema.ruleActionExecutedEventTypeEnabledOverrides }
        : Object.create(null),
      ruleExecuteActionsOverrides: (ruleSchema.ruleExecuteActionsOverrides && typeof ruleSchema.ruleExecuteActionsOverrides === "object")
        ? { ...ruleSchema.ruleExecuteActionsOverrides }
        : Object.create(null),
      ruleActionTypeEnabledOverrides: (ruleSchema.ruleActionTypeEnabledOverrides && typeof ruleSchema.ruleActionTypeEnabledOverrides === "object")
        ? { ...ruleSchema.ruleActionTypeEnabledOverrides }
        : Object.create(null),
      actionArgOverrides: (ruleSchema.actionArgOverrides && typeof ruleSchema.actionArgOverrides === "object")
        ? { ...ruleSchema.actionArgOverrides }
        : Object.create(null),
    });
    if (integrityErrors.length) {
      try {
        console.warn(
          `[receiver-bootstrap] rule schema integrity invalid; using safe disabled fallback (${integrityErrors.length} errors)`
        );
      } catch (_) {}
      adapterFallbackUsed = true;
      ruleSchema = buildSafeDisabledRuleSchema();
      refreshRuleSchemaDerived();
    }
  }
  const resolvedRuleSource = useInteractionsV2
    ? (adapterFallbackUsed ? "interactions_adapter_fallback" : "interactions_adapter")
    : "rule_engine_master_control";
  try {
    console.info(`[receiver-bootstrap] rule source: ${resolvedRuleSource}`);
  } catch (_) {}
  if (typeof setRuleSchemaRuntime === "function") {
    setRuleSchemaRuntime({
      source: resolvedRuleSource,
      signals: ruleSignals,
      windows: ruleWindows,
      events: ruleEvents,
      rules: ruleRules,
      eventRuntimeBindings: ruleEventRuntimeBindings,
      execution: (ruleSchema.execution && typeof ruleSchema.execution === "object") ? { ...ruleSchema.execution } : Object.create(null),
      ruleActionLimitOverrides: (ruleSchema.ruleActionLimitOverrides && typeof ruleSchema.ruleActionLimitOverrides === "object")
        ? { ...ruleSchema.ruleActionLimitOverrides }
        : Object.create(null),
      ruleCooldownScaleOverrides: (ruleSchema.ruleCooldownScaleOverrides && typeof ruleSchema.ruleCooldownScaleOverrides === "object")
        ? { ...ruleSchema.ruleCooldownScaleOverrides }
        : Object.create(null),
      ruleMatchWindowScaleOverrides: (ruleSchema.ruleMatchWindowScaleOverrides && typeof ruleSchema.ruleMatchWindowScaleOverrides === "object")
        ? { ...ruleSchema.ruleMatchWindowScaleOverrides }
        : Object.create(null),
      ruleEmitPreviewMatchedOverrides: (ruleSchema.ruleEmitPreviewMatchedOverrides && typeof ruleSchema.ruleEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchema.ruleEmitPreviewMatchedOverrides }
        : Object.create(null),
      ruleEmitActionExecutedOverrides: (ruleSchema.ruleEmitActionExecutedOverrides && typeof ruleSchema.ruleEmitActionExecutedOverrides === "object")
        ? { ...ruleSchema.ruleEmitActionExecutedOverrides }
        : Object.create(null),
      ruleEmitSourceEventSummaryOverrides: (ruleSchema.ruleEmitSourceEventSummaryOverrides && typeof ruleSchema.ruleEmitSourceEventSummaryOverrides === "object")
        ? { ...ruleSchema.ruleEmitSourceEventSummaryOverrides }
        : Object.create(null),
      ruleSummaryIncludeSignalAndRuleIdsOverrides: (ruleSchema.ruleSummaryIncludeSignalAndRuleIdsOverrides && typeof ruleSchema.ruleSummaryIncludeSignalAndRuleIdsOverrides === "object")
        ? { ...ruleSchema.ruleSummaryIncludeSignalAndRuleIdsOverrides }
        : Object.create(null),
      ruleSummaryIncludeBudgetCapsOverrides: (ruleSchema.ruleSummaryIncludeBudgetCapsOverrides && typeof ruleSchema.ruleSummaryIncludeBudgetCapsOverrides === "object")
        ? { ...ruleSchema.ruleSummaryIncludeBudgetCapsOverrides }
        : Object.create(null),
      ruleActionExecutedEventTypeEnabledOverrides: (ruleSchema.ruleActionExecutedEventTypeEnabledOverrides && typeof ruleSchema.ruleActionExecutedEventTypeEnabledOverrides === "object")
        ? { ...ruleSchema.ruleActionExecutedEventTypeEnabledOverrides }
        : Object.create(null),
      ruleExecuteActionsOverrides: (ruleSchema.ruleExecuteActionsOverrides && typeof ruleSchema.ruleExecuteActionsOverrides === "object")
        ? { ...ruleSchema.ruleExecuteActionsOverrides }
        : Object.create(null),
      ruleActionTypeEnabledOverrides: (ruleSchema.ruleActionTypeEnabledOverrides && typeof ruleSchema.ruleActionTypeEnabledOverrides === "object")
        ? { ...ruleSchema.ruleActionTypeEnabledOverrides }
        : Object.create(null),
      signalDebounceOverrides: (ruleSchema.signalDebounceOverrides && typeof ruleSchema.signalDebounceOverrides === "object")
        ? { ...ruleSchema.signalDebounceOverrides }
        : Object.create(null),
      signalMaxMatchesOverrides: (ruleSchema.signalMaxMatchesOverrides && typeof ruleSchema.signalMaxMatchesOverrides === "object")
        ? { ...ruleSchema.signalMaxMatchesOverrides }
        : Object.create(null),
      signalEmitPreviewMatchedOverrides: (ruleSchema.signalEmitPreviewMatchedOverrides && typeof ruleSchema.signalEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchema.signalEmitPreviewMatchedOverrides }
        : Object.create(null),
      signalExecuteActionsOverrides: (ruleSchema.signalExecuteActionsOverrides && typeof ruleSchema.signalExecuteActionsOverrides === "object")
        ? { ...ruleSchema.signalExecuteActionsOverrides }
        : Object.create(null),
      signalEmitActionExecutedOverrides: (ruleSchema.signalEmitActionExecutedOverrides && typeof ruleSchema.signalEmitActionExecutedOverrides === "object")
        ? { ...ruleSchema.signalEmitActionExecutedOverrides }
        : Object.create(null),
      signalEmitSourceEventSummaryOverrides: (ruleSchema.signalEmitSourceEventSummaryOverrides && typeof ruleSchema.signalEmitSourceEventSummaryOverrides === "object")
        ? { ...ruleSchema.signalEmitSourceEventSummaryOverrides }
        : Object.create(null),
      signalSummaryIncludeSignalAndRuleIdsOverrides: (ruleSchema.signalSummaryIncludeSignalAndRuleIdsOverrides && typeof ruleSchema.signalSummaryIncludeSignalAndRuleIdsOverrides === "object")
        ? { ...ruleSchema.signalSummaryIncludeSignalAndRuleIdsOverrides }
        : Object.create(null),
      signalSummaryIncludeBudgetCapsOverrides: (ruleSchema.signalSummaryIncludeBudgetCapsOverrides && typeof ruleSchema.signalSummaryIncludeBudgetCapsOverrides === "object")
        ? { ...ruleSchema.signalSummaryIncludeBudgetCapsOverrides }
        : Object.create(null),
      signalActionExecutedEventTypeEnabledOverrides: (ruleSchema.signalActionExecutedEventTypeEnabledOverrides && typeof ruleSchema.signalActionExecutedEventTypeEnabledOverrides === "object")
        ? { ...ruleSchema.signalActionExecutedEventTypeEnabledOverrides }
        : Object.create(null),
      signalActionTypeEnabledOverrides: (ruleSchema.signalActionTypeEnabledOverrides && typeof ruleSchema.signalActionTypeEnabledOverrides === "object")
        ? { ...ruleSchema.signalActionTypeEnabledOverrides }
        : Object.create(null),
      signalMatchWindowScaleOverrides: (ruleSchema.signalMatchWindowScaleOverrides && typeof ruleSchema.signalMatchWindowScaleOverrides === "object")
        ? { ...ruleSchema.signalMatchWindowScaleOverrides }
        : Object.create(null),
      signalCooldownScaleOverrides: (ruleSchema.signalCooldownScaleOverrides && typeof ruleSchema.signalCooldownScaleOverrides === "object")
        ? { ...ruleSchema.signalCooldownScaleOverrides }
        : Object.create(null),
      signalMaxActionsPerRuleMatchOverrides: (ruleSchema.signalMaxActionsPerRuleMatchOverrides && typeof ruleSchema.signalMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchema.signalMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      signalMaxRulesEvaluatedOverrides: (ruleSchema.signalMaxRulesEvaluatedOverrides && typeof ruleSchema.signalMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchema.signalMaxRulesEvaluatedOverrides }
        : Object.create(null),
      signalMaxActionsPerEventOverrides: (ruleSchema.signalMaxActionsPerEventOverrides && typeof ruleSchema.signalMaxActionsPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxActionsPerEventOverrides }
        : Object.create(null),
      signalMaxActionsPerSignalOverrides: (ruleSchema.signalMaxActionsPerSignalOverrides && typeof ruleSchema.signalMaxActionsPerSignalOverrides === "object")
        ? { ...ruleSchema.signalMaxActionsPerSignalOverrides }
        : Object.create(null),
      signalMaxMatchesPerEventOverrides: (ruleSchema.signalMaxMatchesPerEventOverrides && typeof ruleSchema.signalMaxMatchesPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxMatchesPerEventOverrides }
        : Object.create(null),
      signalMaxSignalsPerEventOverrides: (ruleSchema.signalMaxSignalsPerEventOverrides && typeof ruleSchema.signalMaxSignalsPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxSignalsPerEventOverrides }
        : Object.create(null),
      signalMaxSignalsEvaluatedPerEventOverrides: (ruleSchema.signalMaxSignalsEvaluatedPerEventOverrides && typeof ruleSchema.signalMaxSignalsEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxSignalsEvaluatedPerEventOverrides }
        : Object.create(null),
      signalMaxRulesEvaluatedPerEventOverrides: (ruleSchema.signalMaxRulesEvaluatedPerEventOverrides && typeof ruleSchema.signalMaxRulesEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.signalMaxRulesEvaluatedPerEventOverrides }
        : Object.create(null),
      signalStopOnFirstSignalMatchPerEventOverrides: (ruleSchema.signalStopOnFirstSignalMatchPerEventOverrides && typeof ruleSchema.signalStopOnFirstSignalMatchPerEventOverrides === "object")
        ? { ...ruleSchema.signalStopOnFirstSignalMatchPerEventOverrides }
        : Object.create(null),
      signalStopOnFirstMatchOverrides: (ruleSchema.signalStopOnFirstMatchOverrides && typeof ruleSchema.signalStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchema.signalStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventEnabledOverrides: (ruleSchema.sourceEventEnabledOverrides && typeof ruleSchema.sourceEventEnabledOverrides === "object")
        ? { ...ruleSchema.sourceEventEnabledOverrides }
        : Object.create(null),
      sourceEventDebounceOverrides: (ruleSchema.sourceEventDebounceOverrides && typeof ruleSchema.sourceEventDebounceOverrides === "object")
        ? { ...ruleSchema.sourceEventDebounceOverrides }
        : Object.create(null),
      sourceEventMaxSignalsOverrides: (ruleSchema.sourceEventMaxSignalsOverrides && typeof ruleSchema.sourceEventMaxSignalsOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxSignalsOverrides }
        : Object.create(null),
      sourceEventMaxSignalsEvaluatedPerEventOverrides: (ruleSchema.sourceEventMaxSignalsEvaluatedPerEventOverrides && typeof ruleSchema.sourceEventMaxSignalsEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxSignalsEvaluatedPerEventOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerSignalOverrides: (ruleSchema.sourceEventMaxActionsPerSignalOverrides && typeof ruleSchema.sourceEventMaxActionsPerSignalOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxActionsPerSignalOverrides }
        : Object.create(null),
      sourceEventMaxRulesEvaluatedOverrides: (ruleSchema.sourceEventMaxRulesEvaluatedOverrides && typeof ruleSchema.sourceEventMaxRulesEvaluatedOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxRulesEvaluatedOverrides }
        : Object.create(null),
      sourceEventMaxRulesEvaluatedPerEventOverrides: (ruleSchema.sourceEventMaxRulesEvaluatedPerEventOverrides && typeof ruleSchema.sourceEventMaxRulesEvaluatedPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxRulesEvaluatedPerEventOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerEventOverrides: (ruleSchema.sourceEventMaxMatchesPerEventOverrides && typeof ruleSchema.sourceEventMaxMatchesPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxMatchesPerEventOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerEventOverrides: (ruleSchema.sourceEventMaxActionsPerEventOverrides && typeof ruleSchema.sourceEventMaxActionsPerEventOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxActionsPerEventOverrides }
        : Object.create(null),
      sourceEventStopOnFirstSignalMatchOverrides: (ruleSchema.sourceEventStopOnFirstSignalMatchOverrides && typeof ruleSchema.sourceEventStopOnFirstSignalMatchOverrides === "object")
        ? { ...ruleSchema.sourceEventStopOnFirstSignalMatchOverrides }
        : Object.create(null),
      sourceEventEmitPreviewMatchedOverrides: (ruleSchema.sourceEventEmitPreviewMatchedOverrides && typeof ruleSchema.sourceEventEmitPreviewMatchedOverrides === "object")
        ? { ...ruleSchema.sourceEventEmitPreviewMatchedOverrides }
        : Object.create(null),
      sourceEventEmitActionExecutedOverrides: (ruleSchema.sourceEventEmitActionExecutedOverrides && typeof ruleSchema.sourceEventEmitActionExecutedOverrides === "object")
        ? { ...ruleSchema.sourceEventEmitActionExecutedOverrides }
        : Object.create(null),
      sourceEventEmitSourceEventSummaryOverrides: (ruleSchema.sourceEventEmitSourceEventSummaryOverrides && typeof ruleSchema.sourceEventEmitSourceEventSummaryOverrides === "object")
        ? { ...ruleSchema.sourceEventEmitSourceEventSummaryOverrides }
        : Object.create(null),
      sourceEventSummaryIncludeSignalAndRuleIdsOverrides: (ruleSchema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides && typeof ruleSchema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides === "object")
        ? { ...ruleSchema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides }
        : Object.create(null),
      sourceEventSummaryIncludeBudgetCapsOverrides: (ruleSchema.sourceEventSummaryIncludeBudgetCapsOverrides && typeof ruleSchema.sourceEventSummaryIncludeBudgetCapsOverrides === "object")
        ? { ...ruleSchema.sourceEventSummaryIncludeBudgetCapsOverrides }
        : Object.create(null),
      sourceEventActionTypeEnabledOverrides: (ruleSchema.sourceEventActionTypeEnabledOverrides && typeof ruleSchema.sourceEventActionTypeEnabledOverrides === "object")
        ? { ...ruleSchema.sourceEventActionTypeEnabledOverrides }
        : Object.create(null),
      sourceEventActionExecutedEventTypeEnabledOverrides: (ruleSchema.sourceEventActionExecutedEventTypeEnabledOverrides && typeof ruleSchema.sourceEventActionExecutedEventTypeEnabledOverrides === "object")
        ? { ...ruleSchema.sourceEventActionExecutedEventTypeEnabledOverrides }
        : Object.create(null),
      sourceEventExecuteActionsOverrides: (ruleSchema.sourceEventExecuteActionsOverrides && typeof ruleSchema.sourceEventExecuteActionsOverrides === "object")
        ? { ...ruleSchema.sourceEventExecuteActionsOverrides }
        : Object.create(null),
      sourceEventCooldownScaleOverrides: (ruleSchema.sourceEventCooldownScaleOverrides && typeof ruleSchema.sourceEventCooldownScaleOverrides === "object")
        ? { ...ruleSchema.sourceEventCooldownScaleOverrides }
        : Object.create(null),
      sourceEventMatchWindowScaleOverrides: (ruleSchema.sourceEventMatchWindowScaleOverrides && typeof ruleSchema.sourceEventMatchWindowScaleOverrides === "object")
        ? { ...ruleSchema.sourceEventMatchWindowScaleOverrides }
        : Object.create(null),
      sourceEventMaxActionsPerRuleMatchOverrides: (ruleSchema.sourceEventMaxActionsPerRuleMatchOverrides && typeof ruleSchema.sourceEventMaxActionsPerRuleMatchOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxActionsPerRuleMatchOverrides }
        : Object.create(null),
      sourceEventStopOnFirstMatchOverrides: (ruleSchema.sourceEventStopOnFirstMatchOverrides && typeof ruleSchema.sourceEventStopOnFirstMatchOverrides === "object")
        ? { ...ruleSchema.sourceEventStopOnFirstMatchOverrides }
        : Object.create(null),
      sourceEventMaxMatchesPerSignalOverrides: (ruleSchema.sourceEventMaxMatchesPerSignalOverrides && typeof ruleSchema.sourceEventMaxMatchesPerSignalOverrides === "object")
        ? { ...ruleSchema.sourceEventMaxMatchesPerSignalOverrides }
        : Object.create(null),
      actionArgOverrides: (ruleSchema.actionArgOverrides && typeof ruleSchema.actionArgOverrides === "object")
        ? { ...ruleSchema.actionArgOverrides }
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
