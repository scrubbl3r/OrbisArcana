import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { validateOrchestratorV1 } from "./validate-orchestrator-v1.js";
import {
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
} from "./orchestrator-v1-normalizers.js";

const EMPTY_FROZEN_ARRAY = Object.freeze([]);
const EMPTY_FROZEN_OBJECT = Object.freeze({});
const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";

function pickFirstOwnValue(sources, keys) {
  for (const source of sources) {
    for (const key of keys) {
      if (Object.hasOwn(source, key)) return source[key];
    }
  }
  return undefined;
}

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function finiteAtLeastOrNull(value, min) {
  const n = finiteOrNull(value);
  return n == null ? null : Math.max(min, n);
}

function assignNumericFromSources(out, targetKey, sources, sourceKeys, min = null) {
  const rawValue = pickFirstOwnValue(sources, sourceKeys);
  const numValue = min == null
    ? finiteOrNull(rawValue)
    : finiteAtLeastOrNull(rawValue, min);
  if (numValue != null) out[targetKey] = numValue;
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

function keepSelectorWithId(selector) {
  return selector?.id ? selector : null;
}

function buildOnSelectors(rawOn) {
  if (isStringOrArray(rawOn)) {
    return mapDefined(parseOnSelectorList(rawOn), keepSelectorWithId);
  }
  return collectOnEntriesFromObjectSelectors(rawOn);
}

function buildOpenAction(safeRule, defaultsOpen) {
  const openObj = asOpenObject(safeRule.open);
  const openSpells = normalizeIds(asObj(openObj).spells, normalizeSpellId);
  if (!openSpells.length) return null;
  const out = {
    type: ACTION_TYPE_WAKE_WIN,
    spells: openSpells,
  };
  setEnabledIfBoolean(out, openObj);
  assignNumericFromSources(out, "ttlMs", [openObj, defaultsOpen], OPEN_TTL_KEYS, 0);
  return Object.freeze(out);
}

function buildTriggerAction(trigger, defaultsTriggerByEvent) {
  const triggerObj = asTriggerObject(trigger);
  const eventId = normalizeEventId(triggerObj.event);
  if (!eventId) return null;
  const defaultsArgs = asObj(defaultsTriggerByEvent[eventId]);
  const overrideArgs = asObj(triggerObj.args);
  const out = {
    type: ACTION_TYPE_EVENT,
    id: eventId,
    ...defaultsArgs,
    ...overrideArgs,
  };
  setEnabledIfBoolean(out, triggerObj);
  return Object.freeze(out);
}

function applyCompiledRuleNumericDefaults(out, ruleSources) {
  assignNumericFromSources(out, "priority", ruleSources, RULE_PRIORITY_KEYS);
  assignNumericFromSources(out, "cooldownMs", ruleSources, RULE_COOLDOWN_KEYS, 0);
  assignNumericFromSources(
    out,
    "matchWindowMs",
    ruleSources,
    RULE_MATCH_WINDOW_KEYS,
    ORCHESTRATOR_MIN_MATCH_WINDOW_MS
  );
}

function compileOrchestratorRule(rule, defaultsOpen, defaultsRule, defaultsTriggerByEvent) {
  const safeRule = asObj(rule);
  const id = asText(safeRule.id);
  if (!id) return null;
  const on = buildOnSelectors(safeRule.on);
  if (!on.length) return null;
  const openAction = buildOpenAction(safeRule, defaultsOpen);
  const triggerActions = mapDefined(collectRuleTriggerEntries(safeRule), (trigger) =>
    buildTriggerAction(trigger, defaultsTriggerByEvent)
  );
  const then = openAction ? [openAction, ...triggerActions] : triggerActions;
  const out = {
    id,
    on: Object.freeze(on),
    then: Object.freeze(then),
  };
  setEnabledIfBoolean(out, safeRule);
  applyCompiledRuleNumericDefaults(out, [safeRule, defaultsRule]);
  return Object.freeze(out);
}

function collectOrchestratorDefaults(orchestratorObj) {
  const defaultsObj = asObj(orchestratorObj.defaults);
  return {
    defaultsOpen: asObj(defaultsObj.open),
    defaultsRule: asObj(defaultsObj.rule),
    defaultsTriggerByEvent: buildDefaultsTriggerByEvent(defaultsObj),
  };
}

function compileOrchestratorRules(orchestratorObj, defaultsOpen, defaultsRule, defaultsTriggerByEvent) {
  return Object.freeze(mapDefined(orchestratorObj.rules, (rule) =>
    compileOrchestratorRule(rule, defaultsOpen, defaultsRule, defaultsTriggerByEvent)
  ));
}

function validateOrchestratorOrThrow(orchestratorObj) {
  const errors = validateOrchestratorV1(orchestratorObj);
  if (errors.length) {
    throw new Error(`ORCHESTRATOR_V1 validation failed: ${errors.join(" | ")}`);
  }
}

function buildOrchestratorRuleEngineEnvelope(baseRuleEngine, orchestratorObj, compiledRules) {
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: orchestratorObj.enabled !== false,
    signals: EMPTY_FROZEN_ARRAY,
    windows: EMPTY_FROZEN_ARRAY,
    events: EMPTY_FROZEN_ARRAY,
    rules: compiledRules,
    eventRuntimeBindings: EMPTY_FROZEN_OBJECT,
  });
}

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  const orchestratorObj = asObj(orchestratorV1);
  validateOrchestratorOrThrow(orchestratorObj);
  const { defaultsOpen, defaultsRule, defaultsTriggerByEvent } =
    collectOrchestratorDefaults(orchestratorObj);
  const compiledRules = compileOrchestratorRules(
    orchestratorObj,
    defaultsOpen,
    defaultsRule,
    defaultsTriggerByEvent
  );
  return buildOrchestratorRuleEngineEnvelope(baseRuleEngine, orchestratorObj, compiledRules);
}
