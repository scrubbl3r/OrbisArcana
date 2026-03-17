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

function resolveFirstPresentValue(primaryObj, primaryKey, aliasKey, defaultsObj) {
  const primary = asObj(primaryObj);
  const defaultsSafe = asObj(defaultsObj);
  if (Object.prototype.hasOwnProperty.call(primary, primaryKey)) return primary[primaryKey];
  if (Object.prototype.hasOwnProperty.call(primary, aliasKey)) return primary[aliasKey];
  if (Object.prototype.hasOwnProperty.call(defaultsSafe, primaryKey)) return defaultsSafe[primaryKey];
  return defaultsSafe[aliasKey];
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
  if (Object.prototype.hasOwnProperty.call(t, "enabled") && typeof t.enabled === "boolean") {
    out.enabled = t.enabled;
  }
  return Object.freeze(out);
}

function mapOpen(open, defaultsOpen) {
  const o = (typeof open === "string")
    ? Object.freeze({ spells: asSelectorList(open) })
    : (Array.isArray(open)
      ? Object.freeze({ spells: asSelectorList(open) })
      : asObj(open));
  const spells = asSelectorList(o.spells).map(normalizeSpellId).filter(Boolean);
  if (!spells.length) return null;
  const out = {
    type: "wake_win",
    spells,
  };
  if (Object.prototype.hasOwnProperty.call(o, "enabled") && typeof o.enabled === "boolean") {
    out.enabled = o.enabled;
  }
  const ttlMs = resolveFirstPresentValue(o, "ttlMs", "ttl", defaultsOpen);
  const ttlMsNum = Number(ttlMs);
  if (Number.isFinite(ttlMsNum) && ttlMsNum >= 0) {
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

function mapRule(rule, defaults) {
  const r = asObj(rule);
  const defaultsRoot = asObj(defaults);
  const id = asText(r.id);
  if (!id) return null;
  const ruleDefaults = asObj(defaultsRoot.rule);
  const on = [];
  if (typeof r.on === "string" || Array.isArray(r.on)) {
    pushParsedOnSelectors(on, r.on);
  } else {
    const onRaw = asObj(r.on);
    pushNormalizedOnEntries(on, onRaw.spell, normalizeSpellId, "spell");
    pushNormalizedOnEntries(on, onRaw.spells, normalizeSpellId, "spell");
    pushNormalizedOnEntries(on, onRaw.gesture, normalizeGestureId, "gesture");
    pushNormalizedOnEntries(on, onRaw.gestures, normalizeGestureId, "gesture");
    pushNormalizedOnEntries(on, onRaw.orb_state, normalizeOrbStateId, "orb_state");
    pushNormalizedOnEntries(on, onRaw.orbState, normalizeOrbStateId, "orb_state");
    pushNormalizedOnEntries(on, onRaw.orbStates, normalizeOrbStateId, "orb_state");
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
  if (Object.prototype.hasOwnProperty.call(r, "enabled") && typeof r.enabled === "boolean") {
    out.enabled = r.enabled;
  }
  const hasPriority = Object.prototype.hasOwnProperty.call(r, "priority");
  const priority = hasPriority
    ? r.priority
    : ruleDefaults.priority;
  const priorityNum = Number(priority);
  if (Number.isFinite(priorityNum)) {
    out.priority = priorityNum;
  }
  const cooldownMs = resolveFirstPresentValue(r, "cooldownMs", "cooldown", ruleDefaults);
  const cooldownMsNum = Number(cooldownMs);
  if (Number.isFinite(cooldownMsNum)) {
    out.cooldownMs = Math.max(0, cooldownMsNum);
  }
  const matchWindowMs = resolveFirstPresentValue(r, "matchWindowMs", "matchWindow", ruleDefaults);
  const matchWindowMsNum = Number(matchWindowMs);
  if (Number.isFinite(matchWindowMsNum)) {
    out.matchWindowMs = Math.max(100, matchWindowMsNum);
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
