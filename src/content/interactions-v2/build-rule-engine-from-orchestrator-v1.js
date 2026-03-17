import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { validateOrchestratorV1 } from "./validate-orchestrator-v1.js";
import {
  asObj,
  asText,
  normalizeSpellId,
  normalizeEventId,
  normalizeGestureId,
  normalizeOrbStateId,
  parseOnSelector,
  asSelectorList,
  normalizeTriggerEntries,
} from "./orchestrator-v1-normalizers.js";

const MIN_TTL_MS = 0;
const MIN_COOLDOWN_MS = 0;
const MIN_MATCH_WINDOW_MS = 100;

function normalizeTriggerDefaultsByEvent(defaultsTriggerRaw) {
  const out = {};
  for (const [eventIdRaw, args] of Object.entries(asObj(defaultsTriggerRaw))) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    out[eventId] = asObj(args);
  }
  return out;
}

function getMergedTriggerDefaults(defaultsRoot) {
  const defaultsSafe = asObj(defaultsRoot);
  return Object.freeze({
    ...asObj(defaultsSafe.triggers),
    ...asObj(defaultsSafe.trigger),
  });
}

function getNormalizedDefaultsTriggerByEvent(defaultsRoot) {
  return normalizeTriggerDefaultsByEvent(getMergedTriggerDefaults(defaultsRoot));
}

function getMergedTriggerEntries(ruleLike) {
  const source = asObj(ruleLike);
  return [
    ...normalizeTriggerEntries(source.trigger),
    ...normalizeTriggerEntries(source.triggers),
  ];
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizeRuleId(ruleLike) {
  return asText(asObj(ruleLike).id);
}

function getRuleDefaults(defaultsLike) {
  return asObj(asObj(defaultsLike).rule);
}

function normalizeCompilerDefaults(orchestratorLike) {
  return asObj(asObj(orchestratorLike).defaults);
}

function getDefaultsOpen(defaultsLike) {
  return asObj(asObj(defaultsLike).open);
}

function getOrchestratorRules(orchestratorLike) {
  const rules = asObj(orchestratorLike).rules;
  return Array.isArray(rules) ? rules : [];
}

function normalizeRuleEntries(orchestratorLike) {
  return getOrchestratorRules(orchestratorLike);
}

function resolveFirstPresentValue(primaryObj, primaryKey, aliasKey, defaultsObj) {
  const primary = asObj(primaryObj);
  const defaultsSafe = asObj(defaultsObj);
  if (hasOwn(primary, primaryKey)) return primary[primaryKey];
  if (hasOwn(primary, aliasKey)) return primary[aliasKey];
  if (hasOwn(defaultsSafe, primaryKey)) return defaultsSafe[primaryKey];
  return defaultsSafe[aliasKey];
}

function resolveRuleTimingValue(rule, defaultsRule, primaryKey, aliasKey, minValue) {
  const raw = resolveFirstPresentValue(rule, primaryKey, aliasKey, defaultsRule);
  return asFiniteAtLeast(raw, minValue);
}

function resolveRulePriorityValue(rule, defaultsRule) {
  const ruleSafe = asObj(rule);
  const defaultsSafe = asObj(defaultsRule);
  const raw = hasOwn(ruleSafe, "priority")
    ? ruleSafe.priority
    : defaultsSafe.priority;
  return asFiniteNumber(raw);
}

function applyOptionalRuleTimingFields(target, rule, defaultsRule) {
  const out = target;
  const priorityNum = resolveRulePriorityValue(rule, defaultsRule);
  if (priorityNum != null) out.priority = priorityNum;

  const cooldownMsNum = resolveRuleTimingValue(
    rule,
    defaultsRule,
    "cooldownMs",
    "cooldown",
    MIN_COOLDOWN_MS
  );
  if (cooldownMsNum != null) out.cooldownMs = cooldownMsNum;

  const matchWindowMsNum = resolveRuleTimingValue(
    rule,
    defaultsRule,
    "matchWindowMs",
    "matchWindow",
    MIN_MATCH_WINDOW_MS
  );
  if (matchWindowMsNum != null) out.matchWindowMs = matchWindowMsNum;
}

function buildCompiledRule({ id, on, then, rule, defaultsRule }) {
  const out = {
    id,
    on: Object.freeze(on),
    then: Object.freeze(then),
  };
  copyBooleanEnabledIfPresent(out, rule);
  applyOptionalRuleTimingFields(out, rule, defaultsRule);
  return Object.freeze(out);
}

function asFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asFiniteAtLeast(value, min) {
  const n = asFiniteNumber(value);
  return n == null ? null : Math.max(min, n);
}

function isSelectorListLike(value) {
  return typeof value === "string" || Array.isArray(value);
}

function copyBooleanEnabledIfPresent(target, source) {
  const src = asObj(source);
  if (hasOwn(src, "enabled") && typeof src.enabled === "boolean") {
    target.enabled = src.enabled;
  }
}

function normalizeTriggerInput(trigger) {
  return (typeof trigger === "string")
    ? Object.freeze({ event: trigger })
    : asObj(trigger);
}

function resolveOpenTtlMs(open, defaultsOpen) {
  const ttlMs = resolveFirstPresentValue(open, "ttlMs", "ttl", defaultsOpen);
  return asFiniteAtLeast(ttlMs, MIN_TTL_MS);
}

function normalizeOpenInput(open) {
  return isSelectorListLike(open)
    ? Object.freeze({ spells: open })
    : asObj(open);
}

function mapTrigger(trigger, defaultsTriggerByEvent) {
  const t = normalizeTriggerInput(trigger);
  const eventId = normalizeEventId(t.event);
  if (!eventId) return null;
  const out = {
    type: "event",
    id: eventId,
    ...asObj(defaultsTriggerByEvent[eventId]),
    ...asObj(t.args),
  };
  copyBooleanEnabledIfPresent(out, t);
  return Object.freeze(out);
}

function mapOpen(open, defaultsOpen) {
  const o = normalizeOpenInput(open);
  const spells = asSelectorList(o.spells).map(normalizeSpellId).filter(Boolean);
  if (!spells.length) return null;
  const out = {
    type: "wake_win",
    spells,
  };
  copyBooleanEnabledIfPresent(out, o);
  const ttlMsNum = resolveOpenTtlMs(o, defaultsOpen);
  if (ttlMsNum != null) {
    out.ttlMs = ttlMsNum;
  }
  return Object.freeze(out);
}

function pushParsedOnSelectors(target, raw) {
  for (const entry of asSelectorList(raw)) {
    const parsed = parseOnSelector(entry);
    if (parsed?.id) target.push(parsed);
  }
}

function hasCompiledSelectors(compiledOn) {
  return Array.isArray(compiledOn) && compiledOn.length > 0;
}

function pushNormalizedOnEntries(target, raw, normalizeId, type) {
  for (const value of asSelectorList(raw)) {
    const id = normalizeId(value);
    if (id) target.push(Object.freeze({ type, id }));
  }
}

const ON_SELECTOR_SOURCES = Object.freeze([
  Object.freeze({ key: "spell", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "spells", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "gesture", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "gestures", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "orb_state", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbState", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbStates", type: "orb_state", normalize: normalizeOrbStateId }),
]);

function collectOnSelectorsFromObject(target, onRaw) {
  const sourceObj = asObj(onRaw);
  for (const source of ON_SELECTOR_SOURCES) {
    pushNormalizedOnEntries(target, sourceObj[source.key], source.normalize, source.type);
  }
}

function compileOnSelectors(rawOn) {
  const on = [];
  if (isSelectorListLike(rawOn)) {
    pushParsedOnSelectors(on, rawOn);
    return on;
  }
  collectOnSelectorsFromObject(on, rawOn);
  return on;
}

function mapRule(rule, defaults, defaultsTriggerByEvent) {
  const r = asObj(rule);
  const defaultsRoot = asObj(defaults);
  const defaultsOpen = getDefaultsOpen(defaultsRoot);
  const id = normalizeRuleId(r);
  if (!id) return null;
  const ruleDefaults = getRuleDefaults(defaultsRoot);
  const on = compileOnSelectors(r.on);
  if (!hasCompiledSelectors(on)) return null;
  const then = compileRuleActions(r, defaultsOpen, defaultsTriggerByEvent);
  return buildCompiledRule({
    id,
    on,
    then,
    rule: r,
    defaultsRule: ruleDefaults,
  });
}

function compileRuleActions(rule, defaultsOpen, defaultsTriggerByEvent) {
  const source = asObj(rule);
  const actions = [];
  pushOpenAction(actions, source.open, defaultsOpen);
  const triggerActions = compileTriggerActions(source, defaultsTriggerByEvent);
  actions.push(...triggerActions);
  return actions;
}

function pushOpenAction(target, openInput, defaultsOpen) {
  const openAction = mapOpen(openInput, defaultsOpen);
  if (openAction) target.push(openAction);
}

function mapActions(entries, mapper) {
  return entries.map(mapper).filter(Boolean);
}

function compileTriggerActions(ruleLike, defaultsTriggerByEvent) {
  return mapActions(
    getMergedTriggerEntries(ruleLike),
    (trigger) => mapTrigger(trigger, defaultsTriggerByEvent)
  );
}

function compileRulesFromOrchestrator(orchestratorV1, defaults, defaultsTriggerByEvent) {
  return mapActions(
    normalizeRuleEntries(orchestratorV1),
    (rule) => mapRule(rule, defaults, defaultsTriggerByEvent)
  );
}

function buildRuleEnginePayload(baseRuleEngine, orchestratorEnabled, compiledRules) {
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: orchestratorEnabled !== false,
    signals: Object.freeze([]),
    windows: Object.freeze([]),
    events: Object.freeze([]),
    rules: Object.freeze(compiledRules),
    eventRuntimeBindings: Object.freeze({}),
  });
}

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  const errors = validateOrchestratorV1(orchestratorV1);
  if (errors.length) {
    throw new Error(`ORCHESTRATOR_V1 validation failed: ${errors.join(" | ")}`);
  }
  const defaults = normalizeCompilerDefaults(orchestratorV1);
  const defaultsTriggerByEvent = getNormalizedDefaultsTriggerByEvent(defaults);
  const compiledRules = compileRulesFromOrchestrator(
    orchestratorV1,
    defaults,
    defaultsTriggerByEvent
  );
  return buildRuleEnginePayload(baseRuleEngine, orchestratorV1?.enabled, compiledRules);
}
