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

const MIN_MATCH_WINDOW_MS = 100;
const EMPTY_LIST = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

function buildCompiledRule({ id, on, then, rule, defaultsRule }) {
  const ruleSafe = asObj(rule);
  const defaultsSafe = asObj(defaultsRule);
  const out = {
    id,
    on: Object.freeze(on),
    then: Object.freeze(then),
  };
  if (
    Object.hasOwn(ruleSafe, "enabled") &&
    typeof ruleSafe.enabled === "boolean"
  ) {
    out.enabled = ruleSafe.enabled;
  }
  const priorityRaw = Object.hasOwn(ruleSafe, "priority")
    ? ruleSafe.priority
    : defaultsSafe.priority;
  const priorityNumRaw = Number(priorityRaw);
  if (Number.isFinite(priorityNumRaw)) out.priority = priorityNumRaw;

  const cooldownMsRaw = Object.hasOwn(ruleSafe, "cooldownMs")
    ? ruleSafe.cooldownMs
    : Object.hasOwn(ruleSafe, "cooldown")
      ? ruleSafe.cooldown
      : Object.hasOwn(defaultsSafe, "cooldownMs")
        ? defaultsSafe.cooldownMs
        : defaultsSafe.cooldown;
  const cooldownMsNumRaw = Number(cooldownMsRaw);
  const cooldownMsNum = Number.isFinite(cooldownMsNumRaw)
    ? Math.max(0, cooldownMsNumRaw)
    : null;
  if (cooldownMsNum != null) out.cooldownMs = cooldownMsNum;

  const matchWindowMsRaw = Object.hasOwn(ruleSafe, "matchWindowMs")
    ? ruleSafe.matchWindowMs
    : Object.hasOwn(ruleSafe, "matchWindow")
      ? ruleSafe.matchWindow
      : Object.hasOwn(defaultsSafe, "matchWindowMs")
        ? defaultsSafe.matchWindowMs
        : defaultsSafe.matchWindow;
  const matchWindowMsNumRaw = Number(matchWindowMsRaw);
  const matchWindowMsNum = Number.isFinite(matchWindowMsNumRaw)
    ? Math.max(MIN_MATCH_WINDOW_MS, matchWindowMsNumRaw)
    : null;
  if (matchWindowMsNum != null) out.matchWindowMs = matchWindowMsNum;

  return Object.freeze(out);
}

function mapTrigger(trigger, defaultsTriggerByEvent) {
  const t = (typeof trigger === "string")
    ? { event: trigger }
    : asObj(trigger);
  const eventId = normalizeEventId(t.event);
  if (!eventId) return null;
  const out = {
    type: "event",
    id: eventId,
    ...asObj(defaultsTriggerByEvent[eventId]),
    ...asObj(t.args),
  };
  if (Object.hasOwn(t, "enabled") && typeof t.enabled === "boolean") {
    out.enabled = t.enabled;
  }
  return Object.freeze(out);
}

function mapOpen(open, defaultsOpen) {
  const o = (typeof open === "string" || Array.isArray(open))
    ? { spells: open }
    : asObj(open);
  const normalizedSpells = asSelectorList(o.spells).map(normalizeSpellId).filter(Boolean);
  if (!normalizedSpells.length) return null;
  const out = {
    type: "wake_win",
    spells: normalizedSpells,
  };
  if (Object.hasOwn(o, "enabled") && typeof o.enabled === "boolean") {
    out.enabled = o.enabled;
  }
  const ttlMs = Object.hasOwn(o, "ttlMs")
    ? o.ttlMs
    : Object.hasOwn(o, "ttl")
      ? o.ttl
      : Object.hasOwn(defaultsOpen, "ttlMs")
        ? defaultsOpen.ttlMs
        : defaultsOpen.ttl;
  const ttlMsNumRaw = Number(ttlMs);
  const ttlMsNum = Number.isFinite(ttlMsNumRaw)
    ? Math.max(0, ttlMsNumRaw)
    : null;
  if (ttlMsNum != null) out.ttlMs = ttlMsNum;
  return Object.freeze(out);
}

const ON_SELECTOR_SOURCES = [
  { key: "spell", type: "spell", normalize: normalizeSpellId },
  { key: "spells", type: "spell", normalize: normalizeSpellId },
  { key: "gesture", type: "gesture", normalize: normalizeGestureId },
  { key: "gestures", type: "gesture", normalize: normalizeGestureId },
  { key: "orb_state", type: "orb_state", normalize: normalizeOrbStateId },
  { key: "orbState", type: "orb_state", normalize: normalizeOrbStateId },
  { key: "orbStates", type: "orb_state", normalize: normalizeOrbStateId },
];

function compileRule(rule, compileContext) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const on = [];
  if (typeof r.on === "string" || Array.isArray(r.on)) {
    for (const entry of asSelectorList(r.on)) {
      const selector = parseOnSelector(entry);
      if (selector?.id) on.push(selector);
    }
  } else {
    const sourceObj = asObj(r.on);
    for (const source of ON_SELECTOR_SOURCES) {
      for (const value of asSelectorList(sourceObj[source.key])) {
        const id = source.normalize(value);
        if (id) on.push({ type: source.type, id });
      }
    }
  }
  if (!on.length) return null;
  const openAction = mapOpen(r.open, compileContext.defaultsOpen);
  const then = openAction ? [openAction] : [];
  for (const triggerSource of [r.trigger, r.triggers]) {
    for (const trigger of normalizeTriggerEntries(triggerSource)) {
      const action = mapTrigger(trigger, compileContext.defaultsTriggerByEvent);
      if (action) then.push(action);
    }
  }
  return buildCompiledRule({
    id,
    on,
    then,
    rule: r,
    defaultsRule: compileContext.defaultsRule,
  });
}

export function buildRuleEngineFromOrchestratorV1({
  orchestratorV1 = ORCHESTRATOR_V1,
  baseRuleEngine = {},
} = {}) {
  const orchestratorObj = asObj(orchestratorV1);
  const errors = validateOrchestratorV1(orchestratorObj);
  if (errors.length) {
    throw new Error(`ORCHESTRATOR_V1 validation failed: ${errors.join(" | ")}`);
  }
  const defaults = asObj(orchestratorObj.defaults);
  const defaultsTriggerByEvent = {};
  for (const [eventIdRaw, args] of Object.entries({
    ...asObj(defaults.triggers),
    ...asObj(defaults.trigger),
  })) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    defaultsTriggerByEvent[eventId] = asObj(args);
  }
  const compileContext = {
    defaultsOpen: asObj(defaults.open),
    defaultsRule: asObj(defaults.rule),
    defaultsTriggerByEvent,
  };
  return Object.freeze({
    ...baseRuleEngine,
    version: "2",
    enabled: orchestratorObj.enabled !== false,
    signals: EMPTY_LIST,
    windows: EMPTY_LIST,
    events: EMPTY_LIST,
    rules: Object.freeze(
      orchestratorObj.rules
        .map((rule) => compileRule(rule, compileContext))
        .filter(Boolean)
    ),
    eventRuntimeBindings: EMPTY_OBJECT,
  });
}
