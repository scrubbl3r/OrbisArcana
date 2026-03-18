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

const EMPTY_LIST = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

function toNonNegativeFiniteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function toFiniteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toAtLeastFiniteOrNull(value, min) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, n) : null;
}

function getFirstOwnValueByKeys(keys, ...objects) {
  for (const obj of objects) {
    for (const key of keys) {
      if (Object.hasOwn(obj, key)) return obj[key];
    }
  }
  return undefined;
}

function resolveOwnNumber(keys, normalize, ...objects) {
  return normalize(getFirstOwnValueByKeys(keys, ...objects));
}

function resolveRulePriority(ruleSafe, defaultsSafe) {
  return resolveOwnNumber(RULE_PRIORITY_KEYS, toFiniteOrNull, ruleSafe, defaultsSafe);
}

function resolveRuleCooldownMs(ruleSafe, defaultsSafe) {
  return resolveOwnNumber(
    RULE_COOLDOWN_KEYS,
    toNonNegativeFiniteOrNull,
    ruleSafe,
    defaultsSafe
  );
}

function resolveRuleMatchWindowMs(ruleSafe, defaultsSafe) {
  return resolveOwnNumber(
    RULE_MATCH_WINDOW_KEYS,
    (value) => toAtLeastFiniteOrNull(value, ORCHESTRATOR_MIN_MATCH_WINDOW_MS),
    ruleSafe,
    defaultsSafe
  );
}

function resolveTriggerArgs(defaultsTriggerByEvent, eventId, trigger) {
  const defaultsArgs = asObj(defaultsTriggerByEvent[eventId]);
  const overrideArgs = asObj(trigger.args);
  return { ...defaultsArgs, ...overrideArgs };
}

function resolveOpenSpells(open) {
  return normalizeIds(asObj(open).spells, normalizeSpellId);
}

function resolveOpenTtlMs(open, defaultsOpen) {
  return resolveOwnNumber(OPEN_TTL_KEYS, toNonNegativeFiniteOrNull, open, defaultsOpen);
}

function collectDefaultsTriggerByEvent(defaults) {
  const defaultsTriggerByEvent = {};
  for (const [eventIdRaw, args] of getMergedDefaultTriggerEntries(defaults)) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    defaultsTriggerByEvent[eventId] = asObj(args);
  }
  return defaultsTriggerByEvent;
}

function applyCompiledRuleNumericMetadata(out, ruleSafe, defaultsSafe) {
  const priorityNum = resolveRulePriority(ruleSafe, defaultsSafe);
  if (priorityNum != null) out.priority = priorityNum;

  const cooldownMsNum = resolveRuleCooldownMs(ruleSafe, defaultsSafe);
  if (cooldownMsNum != null) out.cooldownMs = cooldownMsNum;

  const matchWindowMsNum = resolveRuleMatchWindowMs(ruleSafe, defaultsSafe);
  if (matchWindowMsNum != null) out.matchWindowMs = matchWindowMsNum;
}

function buildCompiledRule({ id, on, then, rule, defaultsRule }) {
  const ruleSafe = asObj(rule);
  const defaultsSafe = asObj(defaultsRule);
  const out = {
    id,
    on: Object.freeze(on),
    then: Object.freeze(then),
  };
  setEnabledIfBoolean(out, ruleSafe);
  applyCompiledRuleNumericMetadata(out, ruleSafe, defaultsSafe);

  return Object.freeze(out);
}

function mapTrigger(trigger, defaultsTriggerByEvent) {
  const t = asTriggerObject(trigger);
  const eventId = normalizeEventId(t.event);
  if (!eventId) return null;
  const out = {
    type: "event",
    id: eventId,
    ...resolveTriggerArgs(defaultsTriggerByEvent, eventId, t),
  };
  setEnabledIfBoolean(out, t);
  return Object.freeze(out);
}

function mapOpen(open, defaultsOpen) {
  const o = asOpenObject(open);
  const normalizedSpells = resolveOpenSpells(o);
  if (!normalizedSpells.length) return null;
  const out = {
    type: "wake_win",
    spells: normalizedSpells,
  };
  setEnabledIfBoolean(out, o);
  const ttlMsNum = resolveOpenTtlMs(o, defaultsOpen);
  if (ttlMsNum != null) out.ttlMs = ttlMsNum;
  return Object.freeze(out);
}

function collectOnSelectors(onRaw) {
  if (isStringOrArray(onRaw)) {
    return mapDefined(parseOnSelectorList(onRaw), (selector) =>
      selector?.id ? selector : null
    );
  }
  return collectOnEntriesFromObjectSelectors(onRaw);
}

function compileRules(rules, compileContext) {
  return Object.freeze(mapDefined(rules, (rule) => compileRule(rule, compileContext)));
}

function mapTriggerActions(triggerEntries, defaultsTriggerByEvent) {
  return mapDefined(triggerEntries, (trigger) => mapTrigger(trigger, defaultsTriggerByEvent));
}

function buildThenActions(rule, defaultsOpen, defaultsTriggerByEvent) {
  const openAction = mapOpen(rule.open, defaultsOpen);
  const triggerActions = mapTriggerActions(
    collectRuleTriggerEntries(rule),
    defaultsTriggerByEvent
  );
  return openAction ? [openAction, ...triggerActions] : triggerActions;
}

function buildCompileContext(defaults) {
  return {
    defaultsOpen: asObj(defaults.open),
    defaultsRule: asObj(defaults.rule),
    defaultsTriggerByEvent: collectDefaultsTriggerByEvent(defaults),
  };
}

function resolveRuleId(rule) {
  return asText(rule.id);
}

function resolveRuleOnSelectors(rule) {
  return collectOnSelectors(rule.on);
}

function unpackCompileContext(compileContext) {
  return {
    defaultsOpen: compileContext.defaultsOpen,
    defaultsRule: compileContext.defaultsRule,
    defaultsTriggerByEvent: compileContext.defaultsTriggerByEvent,
  };
}

function throwIfOrchestratorInvalid(orchestratorObj) {
  const errors = validateOrchestratorV1(orchestratorObj);
  if (errors.length) throw new Error(`ORCHESTRATOR_V1 validation failed: ${errors.join(" | ")}`);
}

function compileProjectedRules(orchestratorObj) {
  const compileContext = buildCompileContext(asObj(orchestratorObj.defaults));
  return compileRules(orchestratorObj.rules, compileContext);
}

function buildRuntimeEnvelope(baseRuleEngine, orchestratorObj, compiledRules) {
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: orchestratorObj.enabled !== false,
    signals: EMPTY_LIST,
    windows: EMPTY_LIST,
    events: EMPTY_LIST,
    rules: compiledRules,
    eventRuntimeBindings: EMPTY_OBJECT,
  });
}

function resolveCompiledRulePayload(rule, compileContext) {
  const safeRule = asObj(rule);
  const id = resolveRuleId(safeRule);
  if (!id) return null;
  const { defaultsOpen, defaultsRule, defaultsTriggerByEvent } = unpackCompileContext(compileContext);
  const on = resolveRuleOnSelectors(safeRule);
  if (!on.length) return null;
  const then = buildThenActions(safeRule, defaultsOpen, defaultsTriggerByEvent);
  return { id, on, then, rule: safeRule, defaultsRule };
}

function compileRule(rule, compileContext) {
  const payload = resolveCompiledRulePayload(rule, compileContext);
  if (!payload) return null;
  return buildCompiledRule(payload);
}

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  const orchestratorObj = asObj(orchestratorV1);
  throwIfOrchestratorInvalid(orchestratorObj);
  const compiledRules = compileProjectedRules(orchestratorObj);
  return buildRuntimeEnvelope(baseRuleEngine, orchestratorObj, compiledRules);
}
