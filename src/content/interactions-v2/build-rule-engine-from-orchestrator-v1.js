import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { validateOrchestratorV1 } from "./validate-orchestrator-v1.js";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  return String(v == null ? "" : v).trim();
}

function asId(v) {
  return asText(v).toLowerCase();
}

function normalizeSpellId(spellIdRaw) {
  const id = asId(spellIdRaw);
  if (!id) return "";
  return id.startsWith("spell.") ? id.slice("spell.".length) : id;
}

function normalizeEventId(eventIdRaw) {
  const id = asId(eventIdRaw);
  if (!id) return "";
  return id.startsWith("event.") ? id.slice("event.".length) : id;
}

function normalizeGestureId(gestureIdRaw) {
  const id = asId(gestureIdRaw);
  if (!id) return "";
  return id.startsWith("gesture.") ? id.slice("gesture.".length) : id;
}

function normalizeOrbStateId(orbStateIdRaw) {
  const id = asId(orbStateIdRaw);
  if (!id) return "";
  return id.startsWith("orb_state.") ? id.slice("orb_state.".length) : id;
}

function parseOnSelector(raw) {
  const text = asText(raw);
  if (!text) return null;

  let type = "spell";
  let idText = text;

  const colon = text.indexOf(":");
  const dot = text.indexOf(".");
  if (colon > 0) {
    type = asText(text.slice(0, colon)).toLowerCase();
    idText = asText(text.slice(colon + 1));
  } else if (dot > 0) {
    type = asText(text.slice(0, dot)).toLowerCase();
    idText = text;
  }

  if (type === "spell") return Object.freeze({ type, id: normalizeSpellId(idText) });
  if (type === "gesture") return Object.freeze({ type, id: normalizeGestureId(idText) });
  if (type === "orb_state") return Object.freeze({ type, id: normalizeOrbStateId(idText) });
  return null;
}

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return [raw];
  return [];
}

function normalizeTriggerEntries(rawTrigger) {
  if (Array.isArray(rawTrigger)) return rawTrigger;
  if (typeof rawTrigger === "string") return [rawTrigger];
  if (rawTrigger && typeof rawTrigger === "object") {
    return Object.entries(rawTrigger).map(([eventId, spec]) => {
      if (typeof spec === "boolean") {
        return spec
          ? Object.freeze({ event: eventId })
          : Object.freeze({ event: eventId, enabled: false });
      }
      if (spec && typeof spec === "object" && !Array.isArray(spec)) return Object.freeze({ event: eventId, args: spec });
      return Object.freeze({ event: eventId });
    });
  }
  return [];
}

function normalizeTriggerDefaultsByEvent(defaultsTriggerRaw) {
  const out = {};
  for (const [eventIdRaw, args] of Object.entries(asObj(defaultsTriggerRaw))) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    out[eventId] = asObj(args);
  }
  return out;
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
    ? Object.freeze({ spells: [open] })
    : (Array.isArray(open)
      ? Object.freeze({ spells: open })
      : asObj(open));
  const spells = Array.isArray(o.spells)
    ? o.spells.map(normalizeSpellId).filter(Boolean)
    : [];
  if (!spells.length) return null;
  const out = {
    type: "wake_win",
    spells,
  };
  if (Object.prototype.hasOwnProperty.call(o, "enabled") && typeof o.enabled === "boolean") {
    out.enabled = o.enabled;
  }
  const ttlMs = Object.prototype.hasOwnProperty.call(o, "ttlMs")
    ? o.ttlMs
    : asObj(defaultsOpen).ttlMs;
  if (Number.isFinite(Number(ttlMs)) && Number(ttlMs) >= 0) {
    out.ttlMs = Number(ttlMs);
  }
  return Object.freeze(out);
}

function mapRule(rule, defaults) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const ruleDefaults = asObj(defaults.rule);
  const on = [];
  if (typeof r.on === "string") {
    const parsed = parseOnSelector(r.on);
    if (parsed && parsed.id) on.push(parsed);
  } else if (Array.isArray(r.on)) {
    for (const entry of r.on) {
      const parsed = parseOnSelector(entry);
      if (parsed && parsed.id) on.push(parsed);
    }
  } else {
    const onRaw = asObj(r.on);
    for (const spellRaw of asSelectorList(onRaw.spell)) {
      const spellId = normalizeSpellId(spellRaw);
      if (spellId) on.push(Object.freeze({ type: "spell", id: spellId }));
    }
    for (const gestureRaw of asSelectorList(onRaw.gesture)) {
      const gestureId = normalizeGestureId(gestureRaw);
      if (gestureId) on.push(Object.freeze({ type: "gesture", id: gestureId }));
    }
    for (const orbStateRaw of asSelectorList(onRaw.orb_state)) {
      const orbStateId = normalizeOrbStateId(orbStateRaw);
      if (orbStateId) on.push(Object.freeze({ type: "orb_state", id: orbStateId }));
    }
  }
  if (!on.length) return null;
  const then = [];
  const openAction = mapOpen(r.open, asObj(defaults.open));
  if (openAction) then.push(openAction);
  const defaultsTriggerByEvent = normalizeTriggerDefaultsByEvent(asObj(defaults.trigger));
  const triggerActions = normalizeTriggerEntries(r.trigger)
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
  const priority = Object.prototype.hasOwnProperty.call(r, "priority")
    ? r.priority
    : ruleDefaults.priority;
  if (Number.isFinite(Number(priority))) {
    out.priority = Number(priority);
  }
  const cooldownMs = Object.prototype.hasOwnProperty.call(r, "cooldownMs")
    ? r.cooldownMs
    : ruleDefaults.cooldownMs;
  if (Number.isFinite(Number(cooldownMs))) {
    out.cooldownMs = Math.max(0, Number(cooldownMs));
  }
  const matchWindowMs = Object.prototype.hasOwnProperty.call(r, "matchWindowMs")
    ? r.matchWindowMs
    : ruleDefaults.matchWindowMs;
  if (Number.isFinite(Number(matchWindowMs))) {
    out.matchWindowMs = Math.max(100, Number(matchWindowMs));
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
    enabled: orchestratorV1 && orchestratorV1.enabled !== false,
    signals: Object.freeze([]),
    windows: Object.freeze([]),
    events: Object.freeze([]),
    rules: Object.freeze(compiledRules),
    eventRuntimeBindings: Object.freeze({}),
  });
}
