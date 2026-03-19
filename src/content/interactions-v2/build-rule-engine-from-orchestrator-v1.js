import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { validateOrchestratorV1 } from "./validate-orchestrator-v1.js";
import {
  asArray,
  asOpenObject,
  asTriggerObject,
  asObj,
  asText,
  mapDefined,
  setEnabledIfBoolean,
  isStringOrArray,
  ORCHESTRATOR_MIN_MATCH_WINDOW_MS,
  OPEN_TTL_KEYS,
  RULE_COOLDOWN_KEYS,
  RULE_MATCH_WINDOW_KEYS,
  RULE_PRIORITY_KEYS,
  normalizeSpellId,
  normalizeEventId,
  normalizeIds,
  parseOnSelectorList,
  collectOnEntriesFromObjectSelectors,
  collectRuleTriggerEntries,
  getMergedDefaultTriggerEntries,
  finiteAtLeastOrNull,
  finiteOrNull,
} from "./orchestrator-v1-normalizers.js";

const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const RULE_ENGINE_V2_VERSION = "2";
const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});
const ENABLED_FALSE = false;
const ORCHESTRATOR_VALIDATION_ERROR_PREFIX = "ORCHESTRATOR_V1 validation failed: ";
const VALIDATION_ERROR_DELIMITER = " | ";
const FIELD_VERSION = "version";
const FIELD_TYPE = "type";
const FIELD_EVENT = "event";
const FIELD_ARGS = "args";
const FIELD_SPELLS = "spells";
const FIELD_TTL_MS = "ttlMs";
const FIELD_ID = "id";
const FIELD_ON = "on";
const FIELD_THEN = "then";
const RULE_FIELD_OPEN = "open";
const DEFAULTS_FIELD_OPEN = "open";
const DEFAULTS_FIELD_RULE = "rule";
const RULE_OUTPUT_PRIORITY = "priority";
const RULE_OUTPUT_COOLDOWN_MS = "cooldownMs";
const RULE_OUTPUT_MATCH_WINDOW_MS = "matchWindowMs";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_ENABLED = "enabled";
const FIELD_BASE_RULE_ENGINE = "baseRuleEngine";
const FIELD_ORCHESTRATOR_V1 = "orchestratorV1";
const FIELD_SIGNALS = "signals";
const FIELD_WINDOWS = "windows";
const FIELD_EVENTS = "events";
const FIELD_EVENT_RUNTIME_BINDINGS = "eventRuntimeBindings";
const DEFAULT_BUILD_OPTIONS = EMPTY_OBJECT;
const BASE_RULE_ENGINE_SCHEMA = Object.freeze({
  [FIELD_VERSION]: RULE_ENGINE_V2_VERSION,
  [FIELD_SIGNALS]: EMPTY_ARRAY,
  [FIELD_WINDOWS]: EMPTY_ARRAY,
  [FIELD_EVENTS]: EMPTY_ARRAY,
  [FIELD_EVENT_RUNTIME_BINDINGS]: EMPTY_OBJECT,
});

function assignNumericFromSources(out, targetKey, sources, sourceKeys, min = null) {
  let rawValue;
  for (const source of sources) {
    for (const key of sourceKeys) {
      if (Object.hasOwn(source, key)) {
        rawValue = source[key];
        break;
      }
    }
    if (rawValue !== undefined) break;
  }
  const n = min == null
    ? finiteOrNull(rawValue)
    : finiteAtLeastOrNull(rawValue, min);
  if (n != null) out[targetKey] = n;
}

function buildOpenAction(openObj, defaultsOpen) {
  const openSpells = normalizeIds(asObj(openObj)[FIELD_SPELLS], normalizeSpellId);
  if (!openSpells.length) return null;
  const out = {
    [FIELD_TYPE]: ACTION_TYPE_WAKE_WIN,
    [FIELD_SPELLS]: openSpells,
  };
  setEnabledIfBoolean(out, openObj);
  assignNumericFromSources(
    out,
    FIELD_TTL_MS,
    [openObj, defaultsOpen],
    OPEN_TTL_KEYS,
    0
  );
  return Object.freeze(out);
}

function buildTriggerAction(trigger, defaultsTriggerByEvent) {
  const triggerObj = asTriggerObject(trigger);
  const eventId = normalizeEventId(triggerObj[FIELD_EVENT]);
  if (!eventId) return null;
  const out = {
    [FIELD_TYPE]: ACTION_TYPE_EVENT,
    [FIELD_ID]: eventId,
    ...asObj(defaultsTriggerByEvent[eventId]),
    ...asObj(triggerObj[FIELD_ARGS]),
  };
  setEnabledIfBoolean(out, triggerObj);
  return Object.freeze(out);
}

function throwOrchestratorValidationErrorIfAny(errors) {
  const text = asArray(errors).join(VALIDATION_ERROR_DELIMITER);
  if (!text) return;
  throw new Error(`${ORCHESTRATOR_VALIDATION_ERROR_PREFIX}${text}`);
}

function buildDefaultsTriggerByEvent(defaultsObj) {
  const out = {};
  for (const [eventIdRaw, args] of getMergedDefaultTriggerEntries(defaultsObj)) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    out[eventId] = asObj(args);
  }
  return out;
}

function getDefaultsOpen(defaultsObj) {
  return asObj(defaultsObj[DEFAULTS_FIELD_OPEN]);
}

function getDefaultsRule(defaultsObj) {
  return asObj(defaultsObj[DEFAULTS_FIELD_RULE]);
}

function keepSelectorWithId(selector) {
  return selector?.[FIELD_ID] ? selector : null;
}

function buildRuleOnSelectors(ruleOnValue) {
  return isStringOrArray(ruleOnValue)
    ? mapDefined(parseOnSelectorList(ruleOnValue), keepSelectorWithId)
    : collectOnEntriesFromObjectSelectors(ruleOnValue);
}

function buildRuleThenActions(safeRule, defaultsOpen, defaultsTriggerByEvent) {
  const openObj = asOpenObject(safeRule[RULE_FIELD_OPEN]);
  const openAction = buildOpenAction(openObj, defaultsOpen);
  const triggerActions = mapDefined(collectRuleTriggerEntries(safeRule), (trigger) =>
    buildTriggerAction(trigger, defaultsTriggerByEvent)
  );
  return Object.freeze(openAction ? [openAction, ...triggerActions] : triggerActions);
}

function applyRuleOutputNumericFields(out, safeRule, defaultsRule) {
  assignNumericFromSources(out, RULE_OUTPUT_PRIORITY, [safeRule, defaultsRule], RULE_PRIORITY_KEYS);
  assignNumericFromSources(out, RULE_OUTPUT_COOLDOWN_MS, [safeRule, defaultsRule], RULE_COOLDOWN_KEYS, 0);
  assignNumericFromSources(
    out,
    RULE_OUTPUT_MATCH_WINDOW_MS,
    [safeRule, defaultsRule],
    RULE_MATCH_WINDOW_KEYS,
    ORCHESTRATOR_MIN_MATCH_WINDOW_MS
  );
}

function resolveBuildOptions(options) {
  return asObj(options ?? DEFAULT_BUILD_OPTIONS);
}

function resolveOrchestratorObject(optionsObj) {
  return asObj(optionsObj[FIELD_ORCHESTRATOR_V1] || ORCHESTRATOR_V1);
}

function buildBaseRuleEngineOutput(optionsObj, orchestratorObj) {
  return {
    ...asObj(optionsObj[FIELD_BASE_RULE_ENGINE]),
    ...BASE_RULE_ENGINE_SCHEMA,
    [FIELD_ENABLED]: orchestratorObj[FIELD_ENABLED] !== ENABLED_FALSE,
  };
}

function getRuleIdText(rule) {
  return asText(asObj(rule)[FIELD_ID]) || "";
}

function compileOrchestratorRule(rule, defaultsOpen, defaultsTriggerByEvent, defaultsRule) {
  const safeRule = asObj(rule);
  const id = getRuleIdText(safeRule);
  if (!id) return null;
  const on = buildRuleOnSelectors(safeRule[FIELD_ON]);
  if (!on.length) return null;
  const out = {
    [FIELD_ID]: id,
    [FIELD_ON]: Object.freeze(on),
    [FIELD_THEN]: buildRuleThenActions(safeRule, defaultsOpen, defaultsTriggerByEvent),
  };
  setEnabledIfBoolean(out, safeRule);
  applyRuleOutputNumericFields(out, safeRule, defaultsRule);
  return Object.freeze(out);
}

function buildCompiledRules(orchestratorObj, defaultsOpen, defaultsTriggerByEvent, defaultsRule) {
  return Object.freeze(
    mapDefined(orchestratorObj[FIELD_RULES], (rule) =>
      compileOrchestratorRule(rule, defaultsOpen, defaultsTriggerByEvent, defaultsRule)
    )
  );
}

function buildCompilationContext(orchestratorObj) {
  const defaultsObj = asObj(orchestratorObj[FIELD_DEFAULTS]);
  return {
    defaultsOpen: getDefaultsOpen(defaultsObj),
    defaultsRule: getDefaultsRule(defaultsObj),
    defaultsTriggerByEvent: buildDefaultsTriggerByEvent(defaultsObj),
  };
}

export function buildRuleEngineFromOrchestratorV1(options = {}) {
  const safeOptions = resolveBuildOptions(options);
  const orchestratorObj = resolveOrchestratorObject(safeOptions);
  throwOrchestratorValidationErrorIfAny(validateOrchestratorV1(orchestratorObj));
  const {
    defaultsOpen,
    defaultsRule,
    defaultsTriggerByEvent,
  } = buildCompilationContext(orchestratorObj);
  return Object.freeze({
    ...buildBaseRuleEngineOutput(safeOptions, orchestratorObj),
    [FIELD_RULES]: buildCompiledRules(
      orchestratorObj,
      defaultsOpen,
      defaultsTriggerByEvent,
      defaultsRule
    ),
  });
}
