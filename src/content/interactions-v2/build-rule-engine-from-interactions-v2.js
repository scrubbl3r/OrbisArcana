import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { validateInteractionsV2 } from "./validate-interactions-v2.js";

const RESERVED_ACTION_KEYS = new Set(["type", "id", "spells", "overrides", "enabled"]);

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  return String(v == null ? "" : v).trim();
}

function asId(v) {
  return asText(v).toLowerCase();
}

function finiteNonNegativeOrUndef(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function normalizeEventId(eventIdRaw) {
  const id = asId(eventIdRaw);
  if (!id) return "";
  return id.startsWith("event.") ? id.slice("event.".length) : id;
}

function normalizeEventDefaultsMap(defaultsEventRaw) {
  const out = {};
  for (const [rawEventId, args] of Object.entries(asObj(defaultsEventRaw))) {
    const normalizedEventId = normalizeEventId(rawEventId);
    if (!normalizedEventId) continue;
    out[normalizedEventId] = asObj(args);
  }
  return out;
}

function collectEventArgs(action, defaultsForEvent) {
  const out = {
    ...(asObj(defaultsForEvent)),
  };
  for (const [k, v] of Object.entries(asObj(action))) {
    if (RESERVED_ACTION_KEYS.has(k)) continue;
    out[k] = v;
  }
  const overrides = asObj(action && action.overrides);
  for (const [k, v] of Object.entries(overrides)) out[k] = v;
  return out;
}

function mapConditionToV1(cond) {
  const c = asObj(cond);
  const type = asId(c.type);
  const rawId = asId(c.id);
  if (!type || !rawId) return null;
  let id = rawId;
  const pref = `${type}.`;
  if (id.startsWith(pref)) id = id.slice(pref.length);
  if (!id) return null;
  return Object.freeze({ type, id });
}

function mapActionToV1(action, defaults, defaultsEventById) {
  const a = asObj(action);
  const type = asId(a.type);
  if (type === "wake_win") {
    const spells = Array.isArray(a.spells)
      ? a.spells.map((s) => {
          const raw = asId(s);
          return raw.startsWith("spell.") ? raw.slice("spell.".length) : raw;
        }).filter(Boolean)
      : [];
    const ttlMs = finiteNonNegativeOrUndef(
      Object.prototype.hasOwnProperty.call(a, "ttlMs")
        ? a.ttlMs
        : asObj(defaults.wakeWin).ttlMs
    );
    const out = { type: "wake_win", spells };
    if (ttlMs !== undefined) out.ttlMs = ttlMs;
    if (Object.prototype.hasOwnProperty.call(a, "enabled") && typeof a.enabled === "boolean") out.enabled = a.enabled;
    return Object.freeze(out);
  }
  if (type === "event") {
    const id = normalizeEventId(a.id);
    if (!id) return null;
    const out = { type: "event", id, ...collectEventArgs(a, asObj(defaultsEventById[id])) };
    if (Object.prototype.hasOwnProperty.call(a, "enabled") && typeof a.enabled === "boolean") out.enabled = a.enabled;
    return Object.freeze(out);
  }
  return null;
}

function mapRuleToV1(rule, defaults) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const onAll = Array.isArray(asObj(r.on).all) ? asObj(r.on).all : [];
  const conditions = onAll.map(mapConditionToV1).filter(Boolean);
  const defaultsEventById = normalizeEventDefaultsMap(asObj(defaults.event));
  const actions = (Array.isArray(r.then) ? r.then : [])
    .map((a) => mapActionToV1(a, defaults, defaultsEventById))
    .filter(Boolean);
  const out = { id, on: Object.freeze(conditions), then: Object.freeze(actions) };
  if (Object.prototype.hasOwnProperty.call(r, "enabled") && typeof r.enabled === "boolean") out.enabled = r.enabled;
  if (Number.isFinite(Number(r.priority))) out.priority = Number(r.priority);
  return Object.freeze(out);
}

export function buildRuleEngineV1FromInteractionsV2({
  interactionsV2 = INTERACTIONS_V2,
  baseRuleEngineV1 = null,
} = {}) {
  const validation = validateInteractionsV2(interactionsV2);
  if (!validation.ok) {
    throw new Error(`INTERACTIONS_V2 validation failed: ${validation.errors.join(" | ")}`);
  }
  const base = asObj(baseRuleEngineV1);
  const rules = Array.isArray(interactionsV2.rules)
    ? interactionsV2.rules.map((r) => mapRuleToV1(r, asObj(interactionsV2.defaults))).filter(Boolean)
    : [];
  return Object.freeze({
    ...base,
    rules: Object.freeze(rules),
    enabled: interactionsV2.enabled !== false,
  });
}

export function buildRulesV1FromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  const validation = validateInteractionsV2(interactionsV2);
  if (!validation.ok) {
    throw new Error(`INTERACTIONS_V2 validation failed: ${validation.errors.join(" | ")}`);
  }
  return Object.freeze(
    (Array.isArray(interactionsV2.rules) ? interactionsV2.rules : [])
      .map((r) => mapRuleToV1(r, asObj(interactionsV2.defaults)))
      .filter(Boolean)
  );
}

export const buildRuleEngineFromInteractionsV2 = buildRuleEngineV1FromInteractionsV2;
export const buildRulesFromInteractionsV2 = buildRulesV1FromInteractionsV2;
