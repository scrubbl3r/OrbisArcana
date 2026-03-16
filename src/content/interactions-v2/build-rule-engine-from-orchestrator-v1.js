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

function mapTrigger(trigger) {
  const t = asObj(trigger);
  const eventId = normalizeEventId(t.event);
  if (!eventId) return null;
  const out = {
    type: "event",
    id: eventId,
    ...asObj(t.args),
  };
  if (Object.prototype.hasOwnProperty.call(t, "enabled") && typeof t.enabled === "boolean") {
    out.enabled = t.enabled;
  }
  return Object.freeze(out);
}

function mapRule(rule) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const spellId = normalizeSpellId(asObj(r.on).spell);
  if (!spellId) return null;
  const then = (Array.isArray(r.trigger) ? r.trigger : [])
    .map(mapTrigger)
    .filter(Boolean);
  const out = {
    id,
    on: Object.freeze([
      Object.freeze({ type: "spell", id: spellId }),
    ]),
    then: Object.freeze(then),
  };
  if (Object.prototype.hasOwnProperty.call(r, "enabled") && typeof r.enabled === "boolean") {
    out.enabled = r.enabled;
  }
  if (Object.prototype.hasOwnProperty.call(r, "priority") && Number.isFinite(Number(r.priority))) {
    out.priority = Number(r.priority);
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
  const compiledRules = Array.isArray(orchestratorV1.rules)
    ? orchestratorV1.rules.map(mapRule).filter(Boolean)
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
