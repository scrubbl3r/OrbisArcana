/**
 * @typedef {Object} ReceiverInitModules
 * Named module exports loaded by `loadReceiverInitModules()`.
 * This is intentionally broad; the receiver picks only what it needs from the returned object.
 */

export const RULE_ENGINE_SOURCES = Object.freeze({
  COMPILED_INTERACTION_GRAPH_V2: "compiled_interaction_graph_v2",
  COMPILED_INTERACTION_GRAPH_V2_FALLBACK: "compiled_interaction_graph_v2_fallback",
  COMPILED_INTERACTION_GRAPH_V2_DISABLED: "compiled_interaction_graph_v2_disabled",
  COMPILED_INTERACTION_GRAPH_V2_MISSING_BUILDER: "compiled_interaction_graph_v2_missing_builder",
});

export const RULE_ENGINE_SOURCE_READOUT = Object.freeze({
  [RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2]: "Compiled Interaction Graph V2",
  [RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2_FALLBACK]: "Compiled Interaction Graph V2 (safe fallback)",
  [RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2_DISABLED]: "Compiled Interaction Graph V2 disabled",
  [RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2_MISSING_BUILDER]:
    "Compiled Interaction Graph V2 missing builder (safe fallback)",
});

const BOOTSTRAP_FLAG_USE_IN_RECEIVER = "useInReceiverBootstrap";
const RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V = "20260420u";
const VALIDATION_ERROR_DELIMITER = " | ";
const FIELD_ENABLED = "enabled";
const FIELD_SIGNALS = "signals";
const FIELD_WINDOWS = "windows";
const FIELD_EVENTS = "events";
const FIELD_RULES = "rules";
const FIELD_EVENT_RUNTIME_BINDINGS = "eventRuntimeBindings";
const FIELD_EXECUTION = "execution";
const ERR_PREFIX_COMPILED_INTERACTION_GRAPH_V2 = "Compiled interaction graph v2 validation failed: ";
const ERR_PREFIX_WORDBOOK_V2 = "Wordbook v2 validation failed: ";
const ERR_PREFIX_WORD_RUNTIME_ROUTING = "Word runtime routing validation failed: ";
const WARN_COMPILED_INTERACTION_GRAPH_V2_BUILDER_MISSING =
  "[receiver-bootstrap] COMPILED_INTERACTION_GRAPH_V2 builder missing; using safe disabled rule schema";
const WARN_COMPILED_INTERACTION_GRAPH_V2_BUILD_FAILED =
  "[receiver-bootstrap] COMPILED_INTERACTION_GRAPH_V2 build failed; using safe disabled rule schema";
const INFO_RULE_SOURCE_PREFIX = "[receiver-bootstrap] rule source:";
const WARN_RULE_SCHEMA_INVALID_PREFIX =
  "[receiver-bootstrap] rule schema invalid; using safe disabled fallback";
const WARN_RULE_SCHEMA_INTEGRITY_INVALID_PREFIX =
  "[receiver-bootstrap] rule schema integrity invalid; using safe disabled fallback";
const RULE_ENGINE_VERSION_V2 = "2";
const POLICY_ONLY_RULES_EMPTY_ERROR =
  "RULE_ENGINE_POLICY_CONTROL.rules must remain empty; author rules in COMPILED_INTERACTION_GRAPH_V2";
const EMPTY_FROZEN_ARRAY = Object.freeze([]);
const ADAPTER_BASE_FALLBACK_RULE_SCHEMA = Object.freeze({
  version: RULE_ENGINE_VERSION_V2,
  [FIELD_SIGNALS]: EMPTY_FROZEN_ARRAY,
  [FIELD_WINDOWS]: EMPTY_FROZEN_ARRAY,
  [FIELD_EVENTS]: EMPTY_FROZEN_ARRAY,
  [FIELD_RULES]: EMPTY_FROZEN_ARRAY,
  [FIELD_EVENT_RUNTIME_BINDINGS]: Object.create(null),
});
const RULE_SCHEMA_OVERRIDE_FIELDS = Object.freeze([
  FIELD_EXECUTION,
  "ruleActionLimitOverrides",
  "ruleCooldownScaleOverrides",
  "ruleMatchWindowScaleOverrides",
  "ruleEmitPreviewMatchedOverrides",
  "ruleEmitActionExecutedOverrides",
  "ruleEmitSourceEventSummaryOverrides",
  "ruleSummaryIncludeSignalAndRuleIdsOverrides",
  "ruleSummaryIncludeBudgetCapsOverrides",
  "ruleActionExecutedEventTypeEnabledOverrides",
  "ruleExecuteActionsOverrides",
  "ruleActionTypeEnabledOverrides",
  "signalDebounceOverrides",
  "signalMaxMatchesOverrides",
  "signalEmitPreviewMatchedOverrides",
  "signalExecuteActionsOverrides",
  "signalEmitActionExecutedOverrides",
  "signalEmitSourceEventSummaryOverrides",
  "signalSummaryIncludeSignalAndRuleIdsOverrides",
  "signalSummaryIncludeBudgetCapsOverrides",
  "signalActionExecutedEventTypeEnabledOverrides",
  "signalActionTypeEnabledOverrides",
  "signalMatchWindowScaleOverrides",
  "signalCooldownScaleOverrides",
  "signalMaxActionsPerRuleMatchOverrides",
  "signalMaxRulesEvaluatedOverrides",
  "signalMaxActionsPerEventOverrides",
  "signalMaxActionsPerSignalOverrides",
  "signalMaxMatchesPerEventOverrides",
  "signalMaxSignalsPerEventOverrides",
  "signalMaxSignalsEvaluatedPerEventOverrides",
  "signalMaxRulesEvaluatedPerEventOverrides",
  "signalStopOnFirstSignalMatchPerEventOverrides",
  "signalStopOnFirstMatchOverrides",
  "sourceEventEnabledOverrides",
  "sourceEventDebounceOverrides",
  "sourceEventMaxSignalsOverrides",
  "sourceEventMaxSignalsEvaluatedPerEventOverrides",
  "sourceEventMaxActionsPerSignalOverrides",
  "sourceEventMaxRulesEvaluatedOverrides",
  "sourceEventMaxRulesEvaluatedPerEventOverrides",
  "sourceEventMaxMatchesPerEventOverrides",
  "sourceEventMaxActionsPerEventOverrides",
  "sourceEventStopOnFirstSignalMatchOverrides",
  "sourceEventEmitPreviewMatchedOverrides",
  "sourceEventEmitActionExecutedOverrides",
  "sourceEventEmitSourceEventSummaryOverrides",
  "sourceEventSummaryIncludeSignalAndRuleIdsOverrides",
  "sourceEventSummaryIncludeBudgetCapsOverrides",
  "sourceEventActionTypeEnabledOverrides",
  "sourceEventActionExecutedEventTypeEnabledOverrides",
  "sourceEventExecuteActionsOverrides",
  "sourceEventCooldownScaleOverrides",
  "sourceEventMatchWindowScaleOverrides",
  "sourceEventMaxActionsPerRuleMatchOverrides",
  "sourceEventStopOnFirstMatchOverrides",
  "sourceEventMaxMatchesPerSignalOverrides",
  "actionArgOverrides",
]);

function isBootstrapFlagEnabled(config, key) {
  return !!(isObjectLike(config) && config[key] === true);
}

function isObjectLike(value) {
  return !!value && typeof value === "object";
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
  return enabled && isObjectLike(schema[key])
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

function warnWithErrorCount(prefix, count) {
  safeConsoleWarn(`${prefix} (${count} errors)`);
}

function buildRuleSchemaOverridePayload(schema) {
  const payload = {};
  for (const key of RULE_SCHEMA_OVERRIDE_FIELDS) {
    payload[key] = cloneObjectFieldOrNullObject(schema, key);
  }
  return payload;
}

function buildRuleSchemaIntegrityPayload(schema, rules, events, eventRuntimeBindings) {
  return {
    rules,
    events,
    eventRuntimeBindings,
    ...buildRuleSchemaOverridePayload(schema),
  };
}

function buildRuleSchemaRuntimePayload(
  source,
  schema,
  signals,
  windows,
  events,
  rules,
  eventRuntimeBindings,
  debugBootstrap = null,
) {
  return {
    source,
    signals,
    windows,
    events,
    rules,
    eventRuntimeBindings,
    debugBootstrap: debugBootstrap && typeof debugBootstrap === "object"
      ? { ...debugBootstrap }
      : null,
    ...buildRuleSchemaOverridePayload(schema),
  };
}

function deriveRuleSchemaState(schema) {
  const enabled = isRuleSchemaEnabled(schema);
  return {
    enabled,
    signals: cloneArrayFieldIfEnabled(schema, FIELD_SIGNALS, enabled),
    windows: cloneArrayFieldIfEnabled(schema, FIELD_WINDOWS, enabled),
    events: cloneArrayFieldIfEnabled(schema, FIELD_EVENTS, enabled),
    rules: cloneArrayFieldIfEnabled(schema, FIELD_RULES, enabled),
    eventRuntimeBindings: cloneObjectFieldOrNullObject(
      schema,
      FIELD_EVENT_RUNTIME_BINDINGS,
      enabled
    ),
  };
}

function buildAdapterBaseRuleSchema(ruleEnginePolicyControl) {
  if (isObjectLike(ruleEnginePolicyControl)) {
    return Object.freeze({
      ...ruleEnginePolicyControl,
      // V2 adapter owns rule projection; keep base schema policy/definitions only.
      [FIELD_RULES]: EMPTY_FROZEN_ARRAY,
    });
  }
  return ADAPTER_BASE_FALLBACK_RULE_SCHEMA;
}

/**
 * Dynamically import the receiver runtime dependencies used by receiver host startup.
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
    { createOrbDamageVisualsRuntime },
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
    { executeAoeElectric, playElectricAoeRuntime },
    { executeAoeFlame, playFlameAoeRuntime },
    { executeAoeFrost },
    { executeTeleport, teleportOrbRuntimeToSpawn },
    { executeShockwave, triggerShockwaveRuntime },
    { executeBubbleShield },
    {
      clearOrbGraceRuntime,
      grantOrbGraceRuntime,
      isOrbGraceActiveRuntime,
    },
    { executeColorize },
    { createSpellCastExecutor },
    { runOrbRuntimePipeline: runOrbRuntimePipelineImported },
    { buildOrbBaseVisualState, applyOrbBaseVisualCssVars, getCanonicalOrbBaseRadiusPx },
    { createOrbColorRuntime },
    { createOrbShatterRuntimeController },
    { ORB_RUNTIME_CONFIG_DEFAULT },
    { ORB_STATUS_CONFIG_DEFAULT },
    { GAME_THEME_DEFAULT },
    { applyGameThemeCssVars },
    { applyDevConsoleThemeCssVars },
    { buildInputHudViewModel: buildInputHudViewModelImported },
    { runInputFramePipeline: runInputFramePipelineImported },
    { BUBBLE_SHIELD_PRESET_DEFAULT, SHOCKWAVE_PRESET_DEFAULT, FLAME_AOE_PRESET_DEFAULT, ELECTRIC_AOE_PRESET_DEFAULT, TELEPORT_PRESET_DEFAULT, ORB_NOD_PRESET_DEFAULT, hydrateReceiverVfxDefaults },
    { INPUT_GESTURE_CONFIG_DEFAULT },
    { INPUT_DYNAMICS_CONFIG_DEFAULT },
    { CAST_ACTION_REGISTRY_BY_ID },
    { RUNTIME_WORDS_BY_ID },
    { validateSpellRuntimeRouting },
    { validateSpellSchemaIntegrity },
    {
      RULE_ENGINE_POLICY_CONTROL,
      validateRuleEngineConfig,
    },
    {
      COMPILED_INTERACTION_GRAPH_V2,
      COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP,
      buildRuleEngineFromCompiledInteractionGraphV2,
      validateCompiledInteractionGraphV2,
      validateWordbookV2,
    },
    { WORLD_ITEMS },
  ] = await Promise.all([
    import("../events/event-bus.js"),
    import("../state/game-state.js"),
    import("../game-runtime/orb/orb-system.js"),
    import("../game-runtime/orb/orb-lifecycle-vfx-runtime.js"),
    import("../game-runtime/audio/audio-system.js"),
    import("../game-runtime/input/input-systems-bundle.js"),
    import(`../game-runtime/world/world-system.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import(`../game-runtime/resources/resources-system.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import("../game-runtime/orb/orb-systems-bundle.js"),
    import(`../game-runtime/orb/orb-globes-runtime.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import("../voice/providers/voice-provider-manager.js"),
    import("../voice/providers/kws-provider.js"),
    import(`../voice/kws/openwakeword-browser-backend.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import(`../game-runtime/triggers/spell-dispatch-system.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import(`../game-runtime/triggers/rule-engine-preview-system.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import("../runtime-shell/bridges/spell-action-handlers.js"),
    import("../runtime-effects/aoe-electric.js"),
    import("../runtime-effects/aoe-flame.js"),
    import("../runtime-effects/aoe-frost.js"),
    import("../runtime-effects/teleport.js"),
    import("../runtime-effects/shockwave.js"),
    import("../runtime-effects/bubble-shield.js"),
    import("../runtime-effects/float-grace.js"),
    import("../runtime-effects/colorize.js"),
    import("../game-runtime/triggers/spell-cast-executor.js"),
    import(`../game-runtime/orb/orb-runtime-pipeline.js?v=${RECEIVER_BOOTSTRAP_MODULE_CACHE_BUST_V}`),
    import("../game-runtime/orb/orb-base-state.js"),
    import("../game-runtime/orb/orb-color-runtime.js"),
    import("../game-runtime/orb/orb-shatter-runtime.js"),
    import("../content/orb/orb-runtime-config-default.js"),
    import("../content/orb/orb-status-config-default.js"),
    import("../content/theme/game-theme-default.js"),
    import("../ui/theme/apply-game-theme-css-vars.js"),
    import("../ui/dev-console/apply-dev-console-theme-css-vars.js"),
    import("../ui/build-input-hud-view-model.js"),
    import("../game-runtime/input/input-frame-pipeline.js"),
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
    buildRuleEngineFromCompiledInteractionGraphV2,
  };
  const worldItemExports = {
    WORLD_ITEMS: worldItemsResolved,
  };

  return {
    createEventBus,
    createGameState,
    createOrbSystem,
    createOrbDamageVisualsRuntime,
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
    executeAoeElectric,
    playElectricAoeRuntime,
    executeAoeFlame,
    playFlameAoeRuntime,
    executeAoeFrost,
    executeTeleport,
    teleportOrbRuntimeToSpawn,
    executeShockwave,
    triggerShockwaveRuntime,
    executeBubbleShield,
    clearOrbGraceRuntime,
    grantOrbGraceRuntime,
    isOrbGraceActiveRuntime,
    executeColorize,
    createSpellCastExecutor,
    runOrbRuntimePipelineImported,
    buildOrbBaseVisualState,
    applyOrbBaseVisualCssVars,
    getCanonicalOrbBaseRadiusPx,
    createOrbColorRuntime,
    createOrbShatterRuntimeController,
    ORB_RUNTIME_CONFIG_DEFAULT,
    ORB_STATUS_CONFIG_DEFAULT,
    GAME_THEME_DEFAULT,
    applyGameThemeCssVars,
    applyDevConsoleThemeCssVars,
    buildInputHudViewModelImported,
    runInputFramePipelineImported,
    BUBBLE_SHIELD_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    TELEPORT_PRESET_DEFAULT,
    ORB_NOD_PRESET_DEFAULT,
    hydrateReceiverVfxDefaults,
    INPUT_GESTURE_CONFIG_DEFAULT,
    INPUT_DYNAMICS_CONFIG_DEFAULT,
    CAST_ACTION_REGISTRY_BY_ID,
    RUNTIME_WORDS_BY_ID,
    validateSpellRuntimeRouting,
    validateSpellSchemaIntegrity,
    COMPILED_INTERACTION_GRAPH_V2,
    COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP,
    buildRuleEngineFromCompiledInteractionGraphV2,
    validateCompiledInteractionGraphV2,
    validateWordbookV2,
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
 * @property {() => {GRACE_DEFAULT_TTL_MS:number}} [getOrbStatusConfig]
 * @property {(next:{GRACE_DEFAULT_TTL_MS?:number}) => void} [setOrbStatusConfig]
 * @property {Object} [vfxDefaults] Receiver VFX defaults object mutated by preset hydration.
 * @property {() => {INPUT_GESTURE_CFG:Object, INPUT_DYNAMICS_CFG:Object}} [getInputConfigs]
 * @property {(next:{INPUT_GESTURE_CFG?:Object, INPUT_DYNAMICS_CFG?:Object}) => void} [setInputConfigs]
 * @property {(next:{runtimeWordIndex?:Object, runtimeSpellIndex?:Object, castActionRegistryIndex?:Object}) => void} [setRuntimeWordIndexes]
 * @property {(next:{source?:string, signals?:Object[], windows?:Object[], events?:Object[], rules?:Object[], eventRuntimeBindings?:Object}) => void} [setRuleSchema]
 * @property {() => void} [initWordActionHandlers]
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
    applyGameThemeCssVars,
    applyDevConsoleThemeCssVars,
    buildInputHudViewModelImported,
    createSpellActionHandlersImported,
    runInputFramePipelineImported,
    runOrbRuntimePipelineImported,
    ORB_RUNTIME_CONFIG_DEFAULT,
    ORB_STATUS_CONFIG_DEFAULT,
    getCanonicalOrbBaseRadiusPx,
    hydrateReceiverVfxDefaults,
    BUBBLE_SHIELD_PRESET_DEFAULT,
    SHOCKWAVE_PRESET_DEFAULT,
    FLAME_AOE_PRESET_DEFAULT,
    ELECTRIC_AOE_PRESET_DEFAULT,
    TELEPORT_PRESET_DEFAULT,
    ORB_NOD_PRESET_DEFAULT,
    INPUT_GESTURE_CONFIG_DEFAULT,
    INPUT_DYNAMICS_CONFIG_DEFAULT,
    CAST_ACTION_REGISTRY_BY_ID,
    RUNTIME_WORDS_BY_ID,
    validateSpellRuntimeRouting,
    validateSpellSchemaIntegrity,
    RULE_ENGINE_POLICY_CONTROL,
    validateRuleEngineConfig,
    COMPILED_INTERACTION_GRAPH_V2,
    COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP,
    buildRuleEngineFromCompiledInteractionGraphV2,
    validateCompiledInteractionGraphV2,
    validateWordbookV2,
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
    setRuntimeWordIndexes,
    setRuleSchema,
    initWordActionHandlers,
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

  const ruleEnginePolicyControl = isObjectLike(RULE_ENGINE_POLICY_CONTROL)
    ? RULE_ENGINE_POLICY_CONTROL
    : Object.create(null);
  const validateRuleEngine = (typeof validateRuleEngineConfig === "function")
    ? validateRuleEngineConfig
    : (() => []);
  const validateSpellRuntimeRoutingFn = validateSpellRuntimeRouting;
  const validateSpellSchemaIntegrityFn = validateSpellSchemaIntegrity;
  const buildRuleEngineFromCompiledInteractionGraphV2Fn = (typeof buildRuleEngineFromCompiledInteractionGraphV2 === "function")
    ? buildRuleEngineFromCompiledInteractionGraphV2
    : null;
  const setRuleSchemaRuntime = (typeof setRuleSchema === "function") ? setRuleSchema : undefined;
  const adapterBaseRuleSchema = buildAdapterBaseRuleSchema(ruleEnginePolicyControl);
  const useCompiledInteractionGraphV2 = isBootstrapFlagEnabled(
    COMPILED_INTERACTION_GRAPH_V2_BOOTSTRAP,
    BOOTSTRAP_FLAG_USE_IN_RECEIVER
  );
  const selectedRuleSourceMode = "compiled_interaction_graph_v2";
  let adapterFallbackUsed = false;
  let ruleSource = RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2;
  let ruleSchema = buildSafeDisabledRuleSchema();
  const debugBootstrap = {
    selectedRuleSourceMode,
    adapterFallbackUsed: false,
    buildRules: 0,
    buildSignals: 0,
    postValidateRules: 0,
    postValidateSignals: 0,
    postIntegrityRules: 0,
    postIntegritySignals: 0,
    validateErrorCount: 0,
    integrityErrorCount: 0,
    stage: "init",
  };
  if (!useCompiledInteractionGraphV2) {
    adapterFallbackUsed = true;
    debugBootstrap.adapterFallbackUsed = true;
    debugBootstrap.stage = "bootstrap_disabled";
    ruleSource = RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2_DISABLED;
  } else if (typeof buildRuleEngineFromCompiledInteractionGraphV2Fn !== "function") {
    adapterFallbackUsed = true;
    debugBootstrap.adapterFallbackUsed = true;
    debugBootstrap.stage = "missing_builder";
    ruleSource = RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2_MISSING_BUILDER;
    safeConsoleWarn(WARN_COMPILED_INTERACTION_GRAPH_V2_BUILDER_MISSING);
  } else {
    try {
      const compiledInteractionGraphV2Input = COMPILED_INTERACTION_GRAPH_V2;
      if (typeof validateCompiledInteractionGraphV2 === "function") {
        const compiledInteractionGraphV2Errors = validateCompiledInteractionGraphV2(compiledInteractionGraphV2Input);
        const errors = Array.isArray(compiledInteractionGraphV2Errors)
          ? compiledInteractionGraphV2Errors
          : (Array.isArray(compiledInteractionGraphV2Errors && compiledInteractionGraphV2Errors.errors)
            ? compiledInteractionGraphV2Errors.errors
            : []);
        throwValidationErrorIfAny(errors, ERR_PREFIX_COMPILED_INTERACTION_GRAPH_V2);
      }
      ruleSchema = buildRuleEngineFromCompiledInteractionGraphV2Fn({
        compiledInteractionGraphV2: compiledInteractionGraphV2Input,
        baseRuleEngine: adapterBaseRuleSchema,
      });
      const builtState = deriveRuleSchemaState(ruleSchema);
      debugBootstrap.buildRules = builtState.rules.length;
      debugBootstrap.buildSignals = builtState.signals.length;
      debugBootstrap.stage = "built";
    } catch (err) {
      safeConsoleWarn(WARN_COMPILED_INTERACTION_GRAPH_V2_BUILD_FAILED, err);
      adapterFallbackUsed = true;
      debugBootstrap.adapterFallbackUsed = true;
      debugBootstrap.stage = "build_failed";
      ruleSource = RULE_ENGINE_SOURCES.COMPILED_INTERACTION_GRAPH_V2_FALLBACK;
      ruleSchema = buildSafeDisabledRuleSchema();
    }
  }
  let {
    enabled: ruleEngineEnabled,
    signals: ruleSignals,
    windows: ruleWindows,
    events: ruleEvents,
    rules: ruleRules,
    eventRuntimeBindings: ruleEventRuntimeBindings,
  } = deriveRuleSchemaState(ruleSchema);

  function refreshRuleSchemaDerived() {
    ({
      enabled: ruleEngineEnabled,
      signals: ruleSignals,
      windows: ruleWindows,
      events: ruleEvents,
      rules: ruleRules,
      eventRuntimeBindings: ruleEventRuntimeBindings,
    } = deriveRuleSchemaState(ruleSchema));
  }

  if (GAME_THEME_DEFAULT) {
    if (typeof applyGameThemeCssVars === "function") applyGameThemeCssVars(GAME_THEME_DEFAULT);
    if (typeof applyDevConsoleThemeCssVars === "function") applyDevConsoleThemeCssVars(GAME_THEME_DEFAULT);
    if (typeof applyRuntimeTheme === "function") applyRuntimeTheme(GAME_THEME_DEFAULT);
  }

  setModuleIfFunction(setBuildInputHudViewModelModule, buildInputHudViewModelImported);
  setModuleIfFunction(setCreateSpellActionHandlersModule, createSpellActionHandlersImported);
  setModuleIfFunction(setRunInputFramePipelineModule, runInputFramePipelineImported);
  setModuleIfFunction(setRunOrbRuntimePipelineModule, runOrbRuntimePipelineImported);

  if (isObjectLike(ORB_RUNTIME_CONFIG_DEFAULT) &&
      typeof getOrbRuntimeConfig === "function" && typeof setOrbRuntimeConfig === "function") {
    const current = getOrbRuntimeConfig() || {};
    const cfg = ORB_RUNTIME_CONFIG_DEFAULT;
    setOrbRuntimeConfig({
      PHYS: isObjectLike(cfg.physics)
        ? {
            ...(current.PHYS || {}),
            ...cfg.physics,
            orbRadiusPx: getCanonicalOrbBaseRadiusPx(),
          }
        : current.PHYS,
      SHIELD_DESCENT: isObjectLike(cfg.shieldDescent) ? { ...(current.SHIELD_DESCENT || {}), ...cfg.shieldDescent } : current.SHIELD_DESCENT,
      IMPACT_MODEL: isObjectLike(cfg.impact?.model) ? { ...(current.IMPACT_MODEL || {}), ...cfg.impact.model } : current.IMPACT_MODEL,
      IMPACT_TH: (cfg.impact && Number.isFinite(Number(cfg.impact.threshold))) ? Number(cfg.impact.threshold) : current.IMPACT_TH,
    });
  }

  if (isObjectLike(ORB_STATUS_CONFIG_DEFAULT) &&
      typeof getOrbStatusConfig === "function" && typeof setOrbStatusConfig === "function") {
    const current = getOrbStatusConfig() || {};
    const fg = isObjectLike(ORB_STATUS_CONFIG_DEFAULT.grace)
      ? ORB_STATUS_CONFIG_DEFAULT.grace
      : {};
    setOrbStatusConfig({
      GRACE_DEFAULT_TTL_MS: Number.isFinite(Number(fg.defaultTtlMs))
        ? Number(fg.defaultTtlMs)
        : current.GRACE_DEFAULT_TTL_MS,
    });
  }

  if (typeof hydrateReceiverVfxDefaults === "function" && vfxDefaults) {
    hydrateReceiverVfxDefaults(vfxDefaults, {
      bubbleShield: BUBBLE_SHIELD_PRESET_DEFAULT,
      shockwave: SHOCKWAVE_PRESET_DEFAULT,
      flameAoe: FLAME_AOE_PRESET_DEFAULT,
      electricAoe: ELECTRIC_AOE_PRESET_DEFAULT,
      teleport: TELEPORT_PRESET_DEFAULT,
      orbNod: ORB_NOD_PRESET_DEFAULT,
    });
  }

  if (isObjectLike(INPUT_GESTURE_CONFIG_DEFAULT) ||
      isObjectLike(INPUT_DYNAMICS_CONFIG_DEFAULT)) {
    const currentInputCfg = (typeof getInputConfigs === "function" ? getInputConfigs() : {}) || {};
    if (typeof setInputConfigs === "function") {
      setInputConfigs({
        INPUT_GESTURE_CFG: isObjectLike(INPUT_GESTURE_CONFIG_DEFAULT)
          ? INPUT_GESTURE_CONFIG_DEFAULT
          : currentInputCfg.INPUT_GESTURE_CFG,
        INPUT_DYNAMICS_CFG: isObjectLike(INPUT_DYNAMICS_CONFIG_DEFAULT)
          ? INPUT_DYNAMICS_CONFIG_DEFAULT
          : currentInputCfg.INPUT_DYNAMICS_CFG,
      });
    }
  }

  const runtimeWordIndex = (RUNTIME_WORDS_BY_ID && typeof RUNTIME_WORDS_BY_ID === "object")
    ? RUNTIME_WORDS_BY_ID
    : Object.create(null);

  if (typeof setRuntimeWordIndexes === "function") {
    setRuntimeWordIndexes({
      runtimeWordIndex,
      runtimeSpellIndex: runtimeWordIndex,
      castActionRegistryIndex: CAST_ACTION_REGISTRY_BY_ID || Object.create(null),
    });
  }

  if (typeof validateSpellRuntimeRoutingFn === "function") {
    const validateWordInventory = (typeof validateWordbookV2 === "function")
      ? validateWordbookV2
      : null;
    if (typeof validateWordInventory === "function") {
      const wordbookErrors = validateWordInventory();
      throwValidationErrorIfAny(wordbookErrors, ERR_PREFIX_WORDBOOK_V2);
    }
    const routingErrors = validateSpellRuntimeRoutingFn();
    throwValidationErrorIfAny(routingErrors, ERR_PREFIX_WORD_RUNTIME_ROUTING);
  }

  if (typeof validateRuleEngine === "function") {
    // `validateRuleEngineConfig` includes one master-control authoring invariant
    // (`RULE_ENGINE_POLICY_CONTROL.rules must remain empty`) that does not apply
    // to compiled runtime rule schemas (for example orchestrator/interactions adapters).
    const errors = validateRuleEngine(ruleSchema).filter(
      (msg) => String(msg || "") !== POLICY_ONLY_RULES_EMPTY_ERROR
    );
    debugBootstrap.validateErrorCount = errors.length;
    if (errors.length) {
      warnWithErrorCount(WARN_RULE_SCHEMA_INVALID_PREFIX, errors.length);
      adapterFallbackUsed = true;
      debugBootstrap.adapterFallbackUsed = true;
      debugBootstrap.stage = "validate_failed";
      ruleSchema = buildSafeDisabledRuleSchema();
      refreshRuleSchemaDerived();
    }
    debugBootstrap.postValidateRules = ruleRules.length;
    debugBootstrap.postValidateSignals = ruleSignals.length;
  }
  if (typeof validateSpellSchemaIntegrityFn === "function") {
    const integrityErrors = validateSpellSchemaIntegrityFn(
      buildRuleSchemaIntegrityPayload(
        ruleSchema,
        ruleRules,
        ruleEvents,
        ruleEventRuntimeBindings
      )
    );
    debugBootstrap.integrityErrorCount = integrityErrors.length;
    if (integrityErrors.length) {
      warnWithErrorCount(WARN_RULE_SCHEMA_INTEGRITY_INVALID_PREFIX, integrityErrors.length);
      adapterFallbackUsed = true;
      debugBootstrap.adapterFallbackUsed = true;
      debugBootstrap.stage = "integrity_failed";
      ruleSchema = buildSafeDisabledRuleSchema();
      refreshRuleSchemaDerived();
    }
    debugBootstrap.postIntegrityRules = ruleRules.length;
    debugBootstrap.postIntegritySignals = ruleSignals.length;
  }
  if (debugBootstrap.stage === "built") {
    debugBootstrap.stage = "ready";
  }
  const resolvedRuleSource = adapterFallbackUsed
    ? ruleSource
    : (selectedRuleSourceMode === "interactions_v2"
      ? RULE_ENGINE_SOURCES.INTERACTIONS_ADAPTER
      : ruleSource);
  safeConsoleInfo(`${INFO_RULE_SOURCE_PREFIX} ${resolvedRuleSource}`);
  if (typeof setRuleSchemaRuntime === "function") {
    setRuleSchemaRuntime(
      buildRuleSchemaRuntimePayload(
        resolvedRuleSource,
        ruleSchema,
        ruleSignals,
        ruleWindows,
        ruleEvents,
        ruleRules,
        ruleEventRuntimeBindings,
        debugBootstrap
      )
    );
  }

  if (typeof initWordActionHandlers === "function") {
    initWordActionHandlers();
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
