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

function resolveFirstPresentValue(primaryObj, primaryKey, aliasKey, defaultsObj) {
  const primary = asObj(primaryObj);
  const defaultsSafe = asObj(defaultsObj);
  if (Object.hasOwn(primary, primaryKey)) return primary[primaryKey];
  if (Object.hasOwn(primary, aliasKey)) return primary[aliasKey];
  if (Object.hasOwn(defaultsSafe, primaryKey)) return defaultsSafe[primaryKey];
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
  const priorityRaw = Object.hasOwn(ruleSafe, "priority")
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

function copyBooleanEnabledIfPresent(target, source) {
  const src = asObj(source);
  if (Object.hasOwn(src, "enabled") && typeof src.enabled === "boolean") {
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
  const o = (typeof open === "string" || Array.isArray(open))
    ? Object.freeze({ spells: open })
    : asObj(open);
  const spells = asSelectorList(o.spells)
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

const ON_SELECTOR_SOURCES = Object.freeze([
  Object.freeze({ key: "spell", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "spells", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "gesture", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "gestures", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "orb_state", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbState", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbStates", type: "orb_state", normalize: normalizeOrbStateId }),
]);

function compileRule(rule, compileContext) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const on = [];
  if (typeof r.on === "string" || Array.isArray(r.on)) {
    for (const entry of asSelectorList(r.on)) {
      const parsed = parseOnSelector(entry);
      if (parsed?.id) on.push(parsed);
    }
  } else {
    const sourceObj = asObj(r.on);
    for (const source of ON_SELECTOR_SOURCES) {
      for (const value of asSelectorList(sourceObj[source.key])) {
        const selectorId = source.normalize(value);
        if (selectorId) on.push(Object.freeze({ type: source.type, id: selectorId }));
      }
    }
  }
  if (!on.length) return null;
  const then = [];
  const openAction = mapOpen(r.open, compileContext.defaultsOpen);
  if (openAction) then.push(openAction);
  const triggerActions = [
    ...normalizeTriggerEntries(r.trigger),
    ...normalizeTriggerEntries(r.triggers),
  ]
    .map((trigger) => mapTrigger(trigger, compileContext.defaultsTriggerByEvent))
    .filter(Boolean);
  then.push(...triggerActions);
  return buildCompiledRule({
    id,
    on,
    then,
    rule: r,
    defaultsRule: compileContext.defaultsRule,
  });
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

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
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
  for (const [eventIdRaw, args] of Object.entries(defaultsTriggerRaw)) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    defaultsTriggerByEvent[eventId] = asObj(args);
  }
  const compiledRules = compileRulesFromOrchestrator(
    orchestratorV1,
    defaults,
    defaultsTriggerByEvent
  );
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
