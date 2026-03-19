/**
 * @typedef {Object} ReceiverInitModules
 * Named module exports loaded by `loadReceiverInitModules()`.
 * This is intentionally broad; the receiver picks only what it needs from the returned object.
 */

export const RULE_ENGINE_SOURCES = Object.freeze({
  ORCHESTRATOR_V1: "orchestrator_v1",
  ORCHESTRATOR_V1_PROJECTED: "orchestrator_v1_projected",
  ORCHESTRATOR_V1_FALLBACK: "orchestrator_v1_fallback",
  ORCHESTRATOR_V1_DISABLED: "orchestrator_v1_disabled",
  ORCHESTRATOR_V1_MISSING_BUILDER: "orchestrator_v1_missing_builder",
  INTERACTIONS_ADAPTER: "interactions_adapter",
  INTERACTIONS_ADAPTER_FALLBACK: "interactions_adapter_fallback",
  INTERACTIONS_BOOTSTRAP_DISABLED: "interactions_bootstrap_disabled",
  INTERACTIONS_ADAPTER_MISSING_BUILDER: "interactions_adapter_missing_builder",
});

export const RULE_ENGINE_SOURCE_READOUT = Object.freeze({
  [RULE_ENGINE_SOURCES.ORCHESTRATOR_V1]: "Orchestrator V1",
  [RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_PROJECTED]: "Orchestrator V1 (projected from interactions)",
  [RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_FALLBACK]: "Orchestrator V1 (safe fallback)",
  [RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_DISABLED]: "Orchestrator V1 disabled",
  [RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_MISSING_BUILDER]: "Orchestrator V1 missing builder (safe fallback)",
  [RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER]: "V2 adapter",
  [RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER_FALLBACK]: "V2 adapter (safe fallback)",
  [RULE_ENGINE_SOURCES.INTERACTIONS_BOOTSTRAP_DISABLED]: "V2 bootstrap disabled (safe disabled)",
  [RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER_MISSING_BUILDER]: "V2 adapter missing builder (safe disabled)",
});

const BOOTSTRAP_FLAG_USE_IN_RECEIVER = "useInReceiverBootstrap";
const BOOTSTRAP_FLAG_PROJECT_WHEN_ORCHESTRATOR_EMPTY = "projectFromInteractionsWhenOrchestratorEmpty";
const VALIDATION_ERROR_DELIMITER = " | ";
const FIELD_ENABLED = "enabled";
const FIELD_SIGNALS = "signals";
const FIELD_WINDOWS = "windows";
const FIELD_EVENTS = "events";
const FIELD_RULES = "rules";
const FIELD_EVENT_RUNTIME_BINDINGS = "eventRuntimeBindings";
const FIELD_EXECUTION = "execution";
const ERR_PREFIX_ORCHESTRATOR_V1 = "Orchestrator v1 validation failed: ";
const ERR_PREFIX_SPELLBOOK_V2 = "Spellbook v2 validation failed: ";
const ERR_PREFIX_SPELL_RUNTIME_ROUTING = "Spell runtime routing validation failed: ";

function isBootstrapFlagEnabled(config, key) {
  return !!(config && typeof config === "object" && config[key] === true);
}

function shouldProjectWhenOrchestratorEmpty(config) {
  return !(config && typeof config === "object" &&
    config[BOOTSTRAP_FLAG_PROJECT_WHEN_ORCHESTRATOR_EMPTY] === false);
}

function isRuleSchemaEnabled(schema) {
  return Object.prototype.hasOwnProperty.call(schema, FIELD_ENABLED)
    ? schema[FIELD_ENABLED] !== false
    : true;
}

function cloneArrayFieldIfEnabled(schema, key, enabled) {
  return enabled && Array.isArray(schema[key]) ? schema[key].slice() : [];
}

function cloneObjectFieldOrNullObject(schema, key, enabled = true) {
  return enabled && schema[key] && typeof schema[key] === "object"
    ? { ...schema[key] }
    : Object.create(null);
}

function throwValidationErrorIfAny(errors, messagePrefix) {
  if (!Array.isArray(errors) || !errors.length) return;
  throw new Error(`${messagePrefix}${errors.join(VALIDATION_ERROR_DELIMITER)}`);
}

function safeConsoleWarn(message, maybeError = undefined) {
  try {
    if (maybeError === undefined) {
      console.warn(message);
      return;
    }
    console.warn(message, maybeError);
  } catch (_) {}
}

function safeConsoleInfo(message) {
  try {
    console.info(message);
  } catch (_) {}
}

function setModuleIfFunction(setter, importedFn) {
  if (typeof setter === "function" && typeof importedFn === "function") {
    setter(importedFn);
  }
}

function buildRuleSchemaOverridePayload(schema) {
  return {
    [FIELD_EXECUTION]: cloneObjectFieldOrNullObject(schema, FIELD_EXECUTION),
    ruleActionLimitOverrides: cloneObjectFieldOrNullObject(schema, "ruleActionLimitOverrides"),
    ruleCooldownScaleOverrides: cloneObjectFieldOrNullObject(schema, "ruleCooldownScaleOverrides"),
    ruleMatchWindowScaleOverrides: cloneObjectFieldOrNullObject(schema, "ruleMatchWindowScaleOverrides"),
    ruleEmitPreviewMatchedOverrides: cloneObjectFieldOrNullObject(schema, "ruleEmitPreviewMatchedOverrides"),
    ruleEmitActionExecutedOverrides: cloneObjectFieldOrNullObject(schema, "ruleEmitActionExecutedOverrides"),
    ruleEmitSourceEventSummaryOverrides: cloneObjectFieldOrNullObject(schema, "ruleEmitSourceEventSummaryOverrides"),
    ruleSummaryIncludeSignalAndRuleIdsOverrides: cloneObjectFieldOrNullObject(schema, "ruleSummaryIncludeSignalAndRuleIdsOverrides"),
    ruleSummaryIncludeBudgetCapsOverrides: cloneObjectFieldOrNullObject(schema, "ruleSummaryIncludeBudgetCapsOverrides"),
    ruleActionExecutedEventTypeEnabledOverrides: cloneObjectFieldOrNullObject(schema, "ruleActionExecutedEventTypeEnabledOverrides"),
    ruleExecuteActionsOverrides: cloneObjectFieldOrNullObject(schema, "ruleExecuteActionsOverrides"),
    ruleActionTypeEnabledOverrides: cloneObjectFieldOrNullObject(schema, "ruleActionTypeEnabledOverrides"),
    signalDebounceOverrides: cloneObjectFieldOrNullObject(schema, "signalDebounceOverrides"),
    signalMaxMatchesOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxMatchesOverrides"),
    signalEmitPreviewMatchedOverrides: cloneObjectFieldOrNullObject(schema, "signalEmitPreviewMatchedOverrides"),
    signalExecuteActionsOverrides: cloneObjectFieldOrNullObject(schema, "signalExecuteActionsOverrides"),
    signalEmitActionExecutedOverrides: cloneObjectFieldOrNullObject(schema, "signalEmitActionExecutedOverrides"),
    signalEmitSourceEventSummaryOverrides: cloneObjectFieldOrNullObject(schema, "signalEmitSourceEventSummaryOverrides"),
    signalSummaryIncludeSignalAndRuleIdsOverrides: cloneObjectFieldOrNullObject(schema, "signalSummaryIncludeSignalAndRuleIdsOverrides"),
    signalSummaryIncludeBudgetCapsOverrides: cloneObjectFieldOrNullObject(schema, "signalSummaryIncludeBudgetCapsOverrides"),
    signalActionExecutedEventTypeEnabledOverrides: cloneObjectFieldOrNullObject(schema, "signalActionExecutedEventTypeEnabledOverrides"),
    signalActionTypeEnabledOverrides: cloneObjectFieldOrNullObject(schema, "signalActionTypeEnabledOverrides"),
    signalMatchWindowScaleOverrides: cloneObjectFieldOrNullObject(schema, "signalMatchWindowScaleOverrides"),
    signalCooldownScaleOverrides: cloneObjectFieldOrNullObject(schema, "signalCooldownScaleOverrides"),
    signalMaxActionsPerRuleMatchOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxActionsPerRuleMatchOverrides"),
    signalMaxRulesEvaluatedOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxRulesEvaluatedOverrides"),
    signalMaxActionsPerEventOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxActionsPerEventOverrides"),
    signalMaxActionsPerSignalOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxActionsPerSignalOverrides"),
    signalMaxMatchesPerEventOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxMatchesPerEventOverrides"),
    signalMaxSignalsPerEventOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxSignalsPerEventOverrides"),
    signalMaxSignalsEvaluatedPerEventOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxSignalsEvaluatedPerEventOverrides"),
    signalMaxRulesEvaluatedPerEventOverrides: cloneObjectFieldOrNullObject(schema, "signalMaxRulesEvaluatedPerEventOverrides"),
    signalStopOnFirstSignalMatchPerEventOverrides: cloneObjectFieldOrNullObject(schema, "signalStopOnFirstSignalMatchPerEventOverrides"),
    signalStopOnFirstMatchOverrides: cloneObjectFieldOrNullObject(schema, "signalStopOnFirstMatchOverrides"),
    sourceEventEnabledOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventEnabledOverrides"),
    sourceEventDebounceOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventDebounceOverrides"),
    sourceEventMaxSignalsOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxSignalsOverrides"),
    sourceEventMaxSignalsEvaluatedPerEventOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxSignalsEvaluatedPerEventOverrides"),
    sourceEventMaxActionsPerSignalOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxActionsPerSignalOverrides"),
    sourceEventMaxRulesEvaluatedOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxRulesEvaluatedOverrides"),
    sourceEventMaxRulesEvaluatedPerEventOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxRulesEvaluatedPerEventOverrides"),
    sourceEventMaxMatchesPerEventOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxMatchesPerEventOverrides"),
    sourceEventMaxActionsPerEventOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxActionsPerEventOverrides"),
    sourceEventStopOnFirstSignalMatchOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventStopOnFirstSignalMatchOverrides"),
    sourceEventEmitPreviewMatchedOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventEmitPreviewMatchedOverrides"),
    sourceEventEmitActionExecutedOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventEmitActionExecutedOverrides"),
    sourceEventEmitSourceEventSummaryOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventEmitSourceEventSummaryOverrides"),
    sourceEventSummaryIncludeSignalAndRuleIdsOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventSummaryIncludeSignalAndRuleIdsOverrides"),
    sourceEventSummaryIncludeBudgetCapsOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventSummaryIncludeBudgetCapsOverrides"),
    sourceEventActionTypeEnabledOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventActionTypeEnabledOverrides"),
    sourceEventActionExecutedEventTypeEnabledOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventActionExecutedEventTypeEnabledOverrides"),
    sourceEventExecuteActionsOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventExecuteActionsOverrides"),
    sourceEventCooldownScaleOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventCooldownScaleOverrides"),
    sourceEventMatchWindowScaleOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMatchWindowScaleOverrides"),
    sourceEventMaxActionsPerRuleMatchOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxActionsPerRuleMatchOverrides"),
    sourceEventStopOnFirstMatchOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventStopOnFirstMatchOverrides"),
    sourceEventMaxMatchesPerSignalOverrides: cloneObjectFieldOrNullObject(schema, "sourceEventMaxMatchesPerSignalOverrides"),
    actionArgOverrides: cloneObjectFieldOrNullObject(schema, "actionArgOverrides"),
  };
}

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
      RULE_ENGINE_POLICY_CONTROL,
      validateRuleEngineConfig,
    },
    {
      ORCHESTRATOR_V1,
      ORCHESTRATOR_V1_BOOTSTRAP,
      INTERACTIONS_V2,
      INTERACTIONS_V2_BOOTSTRAP,
      buildRuleEngineFromOrchestratorV1,
      buildRuleEngineFromInteractionsV2,
      projectOrchestratorV1FromInteractionsV2,
      validateOrchestratorV1,
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
    RULE_ENGINE_POLICY_CONTROL,
    validateRuleEngineConfig,
    buildRuleEngineFromOrchestratorV1,
    buildRuleEngineFromInteractionsV2,
    projectOrchestratorV1FromInteractionsV2,
  };
  const worldItemExports = {
    WORLD_ITEMS: worldItemsResolved,
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
    ORCHESTRATOR_V1,
    ORCHESTRATOR_V1_BOOTSTRAP,
    INTERACTIONS_V2,
    INTERACTIONS_V2_BOOTSTRAP,
    projectOrchestratorV1FromInteractionsV2,
    validateOrchestratorV1,
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
    RULE_ENGINE_POLICY_CONTROL,
    validateRuleEngineConfig,
    ORCHESTRATOR_V1,
    ORCHESTRATOR_V1_BOOTSTRAP,
    INTERACTIONS_V2,
    INTERACTIONS_V2_BOOTSTRAP,
    buildRuleEngineFromOrchestratorV1,
    buildRuleEngineFromInteractionsV2,
    projectOrchestratorV1FromInteractionsV2,
    validateOrchestratorV1,
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
    initSpellActionHandlers,
    createSpellCastExecutorContext,
    setSpellCastExecutor,
    setReceiverModulesReady,
  } = ctx;

  function buildSafeDisabledRuleSchema() {
    return Object.freeze({
      id: "rule_engine_safe_disabled",
      version: "2",
      [FIELD_ENABLED]: false,
      [FIELD_SIGNALS]: Object.freeze([]),
      [FIELD_WINDOWS]: Object.freeze([]),
      [FIELD_EVENTS]: Object.freeze([]),
      [FIELD_RULES]: Object.freeze([]),
      [FIELD_EVENT_RUNTIME_BINDINGS]: Object.freeze({}),
      [FIELD_EXECUTION]: Object.freeze({}),
    });
  }

  const ruleEnginePolicyControl = (RULE_ENGINE_POLICY_CONTROL && typeof RULE_ENGINE_POLICY_CONTROL === "object")
    ? RULE_ENGINE_POLICY_CONTROL
    : Object.create(null);
  const validateRuleEngine = (typeof validateRuleEngineConfig === "function")
    ? validateRuleEngineConfig
    : (() => []);
  const validateSpellRuntimeRoutingFn = validateSpellRuntimeRouting;
  const validateSpellSchemaIntegrityFn = validateSpellSchemaIntegrity;
  const buildRuleEngineFromInteractions = (typeof buildRuleEngineFromInteractionsV2 === "function")
    ? buildRuleEngineFromInteractionsV2
    : null;
  const buildRuleEngineFromOrchestrator = (typeof buildRuleEngineFromOrchestratorV1 === "function")
    ? buildRuleEngineFromOrchestratorV1
    : null;
  const projectOrchestratorFromInteractions = (typeof projectOrchestratorV1FromInteractionsV2 === "function")
    ? projectOrchestratorV1FromInteractionsV2
    : null;
  const setRuleSchemaRuntime = (typeof setRuleSchema === "function") ? setRuleSchema : undefined;

  const adapterBaseRuleSchema = (ruleEnginePolicyControl && typeof ruleEnginePolicyControl === "object")
    ? Object.freeze({
        ...ruleEnginePolicyControl,
        // V2 adapter owns rule projection; keep base schema policy/definitions only.
        [FIELD_RULES]: Object.freeze([]),
      })
    : Object.freeze({
        version: "2",
        [FIELD_SIGNALS]: [],
        [FIELD_WINDOWS]: [],
        [FIELD_EVENTS]: [],
        [FIELD_RULES]: [],
        [FIELD_EVENT_RUNTIME_BINDINGS]: Object.create(null),
      });
  const useInteractionsV2 = isBootstrapFlagEnabled(
    INTERACTIONS_V2_BOOTSTRAP,
    BOOTSTRAP_FLAG_USE_IN_RECEIVER
  );
  const useOrchestratorV1 = isBootstrapFlagEnabled(
    ORCHESTRATOR_V1_BOOTSTRAP,
    BOOTSTRAP_FLAG_USE_IN_RECEIVER
  );
  let adapterFallbackUsed = false;
  let ruleSource = useOrchestratorV1
    ? RULE_ENGINE_SOURCES.ORCHESTRATOR_V1
    : RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER;
  let ruleSchema = buildSafeDisabledRuleSchema();
  if (useOrchestratorV1) {
    if (typeof buildRuleEngineFromOrchestrator !== "function") {
      adapterFallbackUsed = true;
      ruleSource = RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_MISSING_BUILDER;
      safeConsoleWarn("[receiver-bootstrap] ORCHESTRATOR_V1 builder missing; using safe disabled rule schema");
    } else {
      try {
        const projectOrchestratorWhenEmpty = shouldProjectWhenOrchestratorEmpty(ORCHESTRATOR_V1_BOOTSTRAP);
        const orchestratorRules = Array.isArray(ORCHESTRATOR_V1 && ORCHESTRATOR_V1[FIELD_RULES])
          ? ORCHESTRATOR_V1[FIELD_RULES]
          : [];
        const orchestratorInput = (projectOrchestratorWhenEmpty && !orchestratorRules.length &&
          typeof projectOrchestratorFromInteractions === "function")
          ? projectOrchestratorFromInteractions(INTERACTIONS_V2)
          : ORCHESTRATOR_V1;
        if (orchestratorInput !== ORCHESTRATOR_V1) {
          ruleSource = RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_PROJECTED;
        }
        if (typeof validateOrchestratorV1 === "function") {
          const orchestratorErrors = validateOrchestratorV1(orchestratorInput);
          throwValidationErrorIfAny(orchestratorErrors, ERR_PREFIX_ORCHESTRATOR_V1);
        }
        ruleSchema = buildRuleEngineFromOrchestrator({
          orchestratorV1: orchestratorInput,
          baseRuleEngine: adapterBaseRuleSchema,
        });
      } catch (err) {
        safeConsoleWarn("[receiver-bootstrap] ORCHESTRATOR_V1 build failed; using safe disabled rule schema", err);
        adapterFallbackUsed = true;
        ruleSource = RULE_ENGINE_SOURCES.ORCHESTRATOR_V1_FALLBACK;
        ruleSchema = buildSafeDisabledRuleSchema();
      }
    }
  } else if (!useInteractionsV2) {
    adapterFallbackUsed = true;
    ruleSource = RULE_ENGINE_SOURCES.INTERACTIONS_BOOTSTRAP_DISABLED;
    safeConsoleWarn("[receiver-bootstrap] INTERACTIONS_V2 bootstrap disabled; using safe disabled rule schema");
  } else if (typeof buildRuleEngineFromInteractions !== "function") {
    adapterFallbackUsed = true;
    ruleSource = RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER_MISSING_BUILDER;
    safeConsoleWarn("[receiver-bootstrap] INTERACTIONS_V2 adapter missing builder; using safe disabled rule schema");
  } else {
    try {
      ruleSchema = buildRuleEngineFromInteractions({
        interactionsV2: INTERACTIONS_V2,
        baseRuleEngine: adapterBaseRuleSchema,
      });
    } catch (err) {
      safeConsoleWarn("[receiver-bootstrap] INTERACTIONS_V2 adapter failed; falling back to adapter base schema", err);
      adapterFallbackUsed = true;
      ruleSource = RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER_FALLBACK;
      ruleSchema = adapterBaseRuleSchema;
    }
  }
  let ruleEngineEnabled = isRuleSchemaEnabled(ruleSchema);
  let ruleSignals = cloneArrayFieldIfEnabled(ruleSchema, FIELD_SIGNALS, ruleEngineEnabled);
  let ruleWindows = cloneArrayFieldIfEnabled(ruleSchema, FIELD_WINDOWS, ruleEngineEnabled);
  let ruleEvents = cloneArrayFieldIfEnabled(ruleSchema, FIELD_EVENTS, ruleEngineEnabled);
  let ruleRules = cloneArrayFieldIfEnabled(ruleSchema, FIELD_RULES, ruleEngineEnabled);
  let ruleEventRuntimeBindings = cloneObjectFieldOrNullObject(
    ruleSchema,
    FIELD_EVENT_RUNTIME_BINDINGS,
    ruleEngineEnabled
  );

  function refreshRuleSchemaDerived() {
    ruleEngineEnabled = isRuleSchemaEnabled(ruleSchema);
    ruleSignals = cloneArrayFieldIfEnabled(ruleSchema, FIELD_SIGNALS, ruleEngineEnabled);
    ruleWindows = cloneArrayFieldIfEnabled(ruleSchema, FIELD_WINDOWS, ruleEngineEnabled);
    ruleEvents = cloneArrayFieldIfEnabled(ruleSchema, FIELD_EVENTS, ruleEngineEnabled);
    ruleRules = cloneArrayFieldIfEnabled(ruleSchema, FIELD_RULES, ruleEngineEnabled);
    ruleEventRuntimeBindings = cloneObjectFieldOrNullObject(
      ruleSchema,
      FIELD_EVENT_RUNTIME_BINDINGS,
      ruleEngineEnabled
    );
  }

  if (GAME_THEME_DEFAULT) {
    if (typeof applyThemeCssVars === "function") applyThemeCssVars(GAME_THEME_DEFAULT);
    if (typeof applyRuntimeTheme === "function") applyRuntimeTheme(GAME_THEME_DEFAULT);
  }

  setModuleIfFunction(setBuildInputHudViewModelModule, buildInputHudViewModelImported);
  setModuleIfFunction(setCreateSpellActionHandlersModule, createSpellActionHandlersImported);
  setModuleIfFunction(setRunInputFramePipelineModule, runInputFramePipelineImported);
  setModuleIfFunction(setRunOrbRuntimePipelineModule, runOrbRuntimePipelineImported);

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
      throwValidationErrorIfAny(spellbookErrors, ERR_PREFIX_SPELLBOOK_V2);
    }
    const routingErrors = validateSpellRuntimeRoutingFn();
    throwValidationErrorIfAny(routingErrors, ERR_PREFIX_SPELL_RUNTIME_ROUTING);
  }

  if (typeof validateRuleEngine === "function") {
    const errors = validateRuleEngine(ruleSchema);
    if (errors.length) {
      safeConsoleWarn(
        `[receiver-bootstrap] rule schema invalid; using safe disabled fallback (${errors.length} errors)`
      );
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
      ...buildRuleSchemaOverridePayload(ruleSchema),
    });
    if (integrityErrors.length) {
      safeConsoleWarn(
        `[receiver-bootstrap] rule schema integrity invalid; using safe disabled fallback (${integrityErrors.length} errors)`
      );
      adapterFallbackUsed = true;
      ruleSchema = buildSafeDisabledRuleSchema();
      refreshRuleSchemaDerived();
    }
  }
  const resolvedRuleSource = adapterFallbackUsed
    ? ruleSource
    : (useOrchestratorV1 ? ruleSource : RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER);
  safeConsoleInfo(`[receiver-bootstrap] rule source: ${resolvedRuleSource}`);
  if (typeof setRuleSchemaRuntime === "function") {
    setRuleSchemaRuntime({
      source: resolvedRuleSource,
      signals: ruleSignals,
      windows: ruleWindows,
      events: ruleEvents,
      rules: ruleRules,
      eventRuntimeBindings: ruleEventRuntimeBindings,
      ...buildRuleSchemaOverridePayload(ruleSchema),
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
