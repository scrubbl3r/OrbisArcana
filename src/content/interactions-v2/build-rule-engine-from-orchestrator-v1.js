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

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function resolveFirstPresentValue(primaryObj, primaryKey, aliasKey, defaultsObj) {
  const primary = asObj(primaryObj);
  const defaultsSafe = asObj(defaultsObj);
  if (hasOwn(primary, primaryKey)) return primary[primaryKey];
  if (hasOwn(primary, aliasKey)) return primary[aliasKey];
  if (hasOwn(defaultsSafe, primaryKey)) return defaultsSafe[primaryKey];
  return defaultsSafe[aliasKey];
}

function buildCompiledRule({ id, on, then, rule, defaultsRule }) {
  const out = {
    id,
    on: Object.freeze(on),
    then: Object.freeze(then),
  };
  copyBooleanEnabledIfPresent(out, rule);

  const ruleSafe = asObj(rule);
  const defaultsSafe = asObj(defaultsRule);
  const priorityRaw = hasOwn(ruleSafe, "priority")
    ? ruleSafe.priority
    : defaultsSafe.priority;
  const priorityNum = asFiniteNumber(priorityRaw);
  if (priorityNum != null) out.priority = priorityNum;

  const cooldownMsRaw = resolveFirstPresentValue(
    ruleSafe,
    "cooldownMs",
    "cooldown",
    defaultsSafe
  );
  const cooldownMsNum = asFiniteAtLeast(cooldownMsRaw, MIN_COOLDOWN_MS);
  if (cooldownMsNum != null) out.cooldownMs = cooldownMsNum;

  const matchWindowMsRaw = resolveFirstPresentValue(
    ruleSafe,
    "matchWindowMs",
    "matchWindow",
    defaultsSafe
  );
  const matchWindowMsNum = asFiniteAtLeast(matchWindowMsRaw, MIN_MATCH_WINDOW_MS);
  if (matchWindowMsNum != null) out.matchWindowMs = matchWindowMsNum;

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

function mapTrigger(trigger, defaultsTriggerByEvent) {
  const t = (typeof trigger === "string")
    ? Object.freeze({ event: trigger })
    : asObj(trigger);
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
  const o = isSelectorListLike(open)
    ? Object.freeze({ spells: open })
    : asObj(open);
  const spells = asSelectorList(asObj(o).spells)
    .map(normalizeSpellId)
    .filter(Boolean);
  if (!spells.length) return null;
  const out = {
    type: "wake_win",
    spells,
  };
  copyBooleanEnabledIfPresent(out, o);
  const ttlMs = resolveFirstPresentValue(o, "ttlMs", "ttl", defaultsOpen);
  const ttlMsNum = asFiniteAtLeast(ttlMs, MIN_TTL_MS);
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

function collectOnSelectors(target, rawOn) {
  if (isSelectorListLike(rawOn)) {
    pushParsedOnSelectors(target, rawOn);
    return;
  }
  collectOnSelectorsFromObject(target, rawOn);
}

function compileRule(rule, compileContext) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const on = [];
  collectOnSelectors(on, r.on);
  if (!on.length) return null;
  const then = compileRuleActions(
    r,
    compileContext.defaultsOpen,
    compileContext.defaultsTriggerByEvent
  );
  return buildCompiledRule({
    id,
    on,
    then,
    rule: r,
    defaultsRule: compileContext.defaultsRule,
  });
}

function compileRuleActions(rule, defaultsOpen, defaultsTriggerByEvent) {
  const source = asObj(rule);
  const actions = [];
  const openAction = mapOpen(source.open, defaultsOpen);
  if (openAction) actions.push(openAction);
  const triggerActions = [
    ...normalizeTriggerEntries(source.trigger),
    ...normalizeTriggerEntries(source.triggers),
  ]
    .map((trigger) => mapTrigger(trigger, defaultsTriggerByEvent))
    .filter(Boolean);
  actions.push(
    ...triggerActions
  );
  return actions;
}

function compileRulesFromOrchestrator(orchestratorV1, defaults, defaultsTriggerByEvent) {
  const defaultsRoot = asObj(defaults);
  const compileContext = Object.freeze({
    defaultsOpen: asObj(defaultsRoot.open),
    defaultsRule: asObj(defaultsRoot.rule),
    defaultsTriggerByEvent,
  });
  const rules = Array.isArray(orchestratorV1?.rules) ? orchestratorV1.rules : [];
  return rules
    .map((rule) => compileRule(rule, compileContext))
    .filter(Boolean);
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

function prepareOrchestratorCompilation(orchestratorV1) {
  const errors = validateOrchestratorV1(orchestratorV1);
  if (errors.length) {
    throw new Error(`ORCHESTRATOR_V1 validation failed: ${errors.join(" | ")}`);
  }
  const defaults = asObj(asObj(orchestratorV1).defaults);
  const defaultsTriggerRaw = Object.freeze({
    ...asObj(defaults.triggers),
    ...asObj(defaults.trigger),
  });
  const defaultsTriggerByEvent = {};
  for (const [eventIdRaw, args] of Object.entries(asObj(defaultsTriggerRaw))) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    defaultsTriggerByEvent[eventId] = asObj(args);
  }
  return Object.freeze({
    defaults,
    defaultsTriggerByEvent,
  });
}

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  const prep = prepareOrchestratorCompilation(orchestratorV1);
  const compiledRules = compileRulesFromOrchestrator(
    orchestratorV1,
    prep.defaults,
    prep.defaultsTriggerByEvent
  );
  return buildRuleEnginePayload(baseRuleEngine, orchestratorV1?.enabled, compiledRules);
}
