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
  if (hasOwn(t, "enabled") && typeof t.enabled === "boolean") {
    out.enabled = t.enabled;
  }
  return Object.freeze(out);
}

function mapOpen(open, defaultsOpen) {
  const openIsSelectorList = isSelectorListLike(open);
  const o = openIsSelectorList ? Object.freeze({ spells: open }) : asObj(open);
  const spells = asSelectorList(o.spells).map(normalizeSpellId).filter(Boolean);
  if (!spells.length) return null;
  const out = {
    type: "wake_win",
    spells,
  };
  if (hasOwn(o, "enabled") && typeof o.enabled === "boolean") {
    out.enabled = o.enabled;
  }
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

function mapRule(rule, defaults) {
  const r = asObj(rule);
  const defaultsRoot = asObj(defaults);
  const id = asText(r.id);
  if (!id) return null;
  const ruleDefaults = asObj(defaultsRoot.rule);
  const on = [];
  if (isSelectorListLike(r.on)) {
    pushParsedOnSelectors(on, r.on);
  } else {
    const onRaw = asObj(r.on);
    for (const source of ON_SELECTOR_SOURCES) {
      pushNormalizedOnEntries(on, onRaw[source.key], source.normalize, source.type);
    }
  }
  if (!on.length) return null;
  const then = [];
  const openAction = mapOpen(r.open, defaultsRoot.open);
  if (openAction) then.push(openAction);
  const defaultsTriggerByEvent = normalizeTriggerDefaultsByEvent(getMergedTriggerDefaults(defaultsRoot));
  const triggerActions = getMergedTriggerEntries(r)
    .map((trigger) => mapTrigger(trigger, defaultsTriggerByEvent))
    .filter(Boolean);
  then.push(...triggerActions);
  const out = {
    id,
    on: Object.freeze(on),
    then: Object.freeze(then),
  };
  if (hasOwn(r, "enabled") && typeof r.enabled === "boolean") {
    out.enabled = r.enabled;
  }
  const hasPriority = hasOwn(r, "priority");
  const priority = hasPriority
    ? r.priority
    : ruleDefaults.priority;
  const priorityNum = asFiniteNumber(priority);
  if (priorityNum != null) {
    out.priority = priorityNum;
  }
  const cooldownMsNum = resolveRuleTimingValue(
    r,
    ruleDefaults,
    "cooldownMs",
    "cooldown",
    MIN_COOLDOWN_MS
  );
  if (cooldownMsNum != null) {
    out.cooldownMs = cooldownMsNum;
  }
  const matchWindowMsNum = resolveRuleTimingValue(
    r,
    ruleDefaults,
    "matchWindowMs",
    "matchWindow",
    MIN_MATCH_WINDOW_MS
  );
  if (matchWindowMsNum != null) {
    out.matchWindowMs = matchWindowMsNum;
  }
  return Object.freeze(out);
}

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  const errors = validateOrchestratorV1(orchestratorV1);
  if (errors.length) {
    throw new Error(`ORCHESTRATOR_V1 validation failed: ${errors.join(" | ")}`);
  }
  const defaults = asObj(orchestratorV1.defaults);
  const compiledRules = Array.isArray(orchestratorV1.rules)
    ? orchestratorV1.rules.map((rule) => mapRule(rule, defaults)).filter(Boolean)
    : [];
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: orchestratorV1?.enabled !== false,
    signals: Object.freeze([]),
    windows: Object.freeze([]),
    events: Object.freeze([]),
    rules: Object.freeze(compiledRules),
    eventRuntimeBindings: Object.freeze({}),
  });
}
