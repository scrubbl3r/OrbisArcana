import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { validateInteractionsV2 } from "./validate-interactions-v2.js";
import {
  asArray,
  asId,
  asObj,
  asText,
  mapDefined,
  normalizeEventId,
  normalizeSpellId,
  setEnabledIfBoolean,
} from "./orchestrator-v1-normalizers.js";

const RESERVED_ACTION_KEYS = Object.freeze(new Set(["type", "id", "spells", "overrides", "enabled"]));

function finiteNonNegativeOrUndef(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function resolveWakeWinTtlMs(action, defaultsRoot) {
  const safeAction = asObj(action);
  const safeDefaults = asObj(defaultsRoot);
  return finiteNonNegativeOrUndef(
    Object.hasOwn(safeAction, "ttlMs")
      ? safeAction.ttlMs
      : asObj(safeDefaults.wakeWin).ttlMs
  );
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
  const overrides = asObj(action?.overrides);
  for (const [k, v] of Object.entries(overrides)) out[k] = v;
  return out;
}

function mapCondition(cond) {
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

function mapWakeWinAction(action, defaultsRoot) {
  const a = asObj(action);
  const spells = mapDefined(asArray(a.spells), (spellId) => normalizeSpellId(spellId));
  const ttlMs = resolveWakeWinTtlMs(a, defaultsRoot);
  const out = { type: "wake_win", spells };
  if (ttlMs !== undefined) out.ttlMs = ttlMs;
  setEnabledIfBoolean(out, a);
  return Object.freeze(out);
}

function mapEventAction(action, defaultsEventById) {
  const a = asObj(action);
  const id = normalizeEventId(a.id);
  if (!id) return null;
  const out = { type: "event", id, ...collectEventArgs(a, asObj(defaultsEventById[id])) };
  setEnabledIfBoolean(out, a);
  return Object.freeze(out);
}

function mapAction(action, defaults, defaultsEventById) {
  const a = asObj(action);
  const type = asId(a.type);
  if (type === "wake_win") return mapWakeWinAction(a, defaults);
  if (type === "event") return mapEventAction(a, defaultsEventById);
  return null;
}

function getRuleOnAll(rule) {
  const safeRule = asObj(rule);
  const onRoot = asObj(safeRule.on);
  return asArray(onRoot.all);
}

function getRuleThenActions(rule) {
  const safeRule = asObj(rule);
  return asArray(safeRule.then);
}

function resolveRuleId(rule) {
  return asText(rule.id);
}

function mapRuleConditions(rule) {
  return mapDefined(getRuleOnAll(rule), mapCondition);
}

function mapRuleActions(rule, defaultsRoot, defaultsEventById) {
  return mapDefined(
    getRuleThenActions(rule),
    (action) => mapAction(action, defaultsRoot, defaultsEventById)
  );
}

function applyRuleMetadata(out, rule) {
  const safeRule = asObj(rule);
  setEnabledIfBoolean(out, safeRule);
  const priorityNum = Number(safeRule.priority);
  if (Number.isFinite(priorityNum)) out.priority = priorityNum;
}

function mapRule(rule, defaults, defaultsEventById) {
  const r = asObj(rule);
  const id = resolveRuleId(r);
  if (!id) return null;
  const conditions = mapRuleConditions(r);
  const actions = mapRuleActions(r, defaults, defaultsEventById);
  const out = { id, on: Object.freeze(conditions), then: Object.freeze(actions) };
  applyRuleMetadata(out, r);
  return Object.freeze(out);
}

function throwIfInteractionsInvalid(interactionsV2) {
  const validation = validateInteractionsV2(interactionsV2);
  if (!validation.ok) {
    throw new Error(`INTERACTIONS_V2 validation failed: ${validation.errors.join(" | ")}`);
  }
}

function buildCompileContext(interactionsV2) {
  const defaultsRoot = asObj(interactionsV2.defaults);
  return {
    defaultsRoot,
    defaultsEventById: normalizeEventDefaultsMap(asObj(defaultsRoot.event)),
  };
}

function unpackCompileContext(compileContext) {
  return {
    defaultsRoot: compileContext.defaultsRoot,
    defaultsEventById: compileContext.defaultsEventById,
  };
}

function mapCompiledRules(interactionsV2, compileContext) {
  const { defaultsRoot, defaultsEventById } = unpackCompileContext(compileContext);
  return mapDefined(
    asArray(interactionsV2.rules),
    (rule) => mapRule(rule, defaultsRoot, defaultsEventById)
  );
}

function buildRuntimeEnvelope(baseRuleEngine, interactionsV2, rules) {
  return Object.freeze({
    ...baseRuleEngine,
    rules: Object.freeze(rules),
    enabled: interactionsV2.enabled !== false,
  });
}

export function buildRuleEngineFromInteractionsV2(options = {}) {
  const {
    interactionsV2 = INTERACTIONS_V2,
    baseRuleEngine = null,
  } = options;
  throwIfInteractionsInvalid(interactionsV2);
  const base = asObj(baseRuleEngine);
  const compileContext = buildCompileContext(interactionsV2);
  const rules = mapCompiledRules(interactionsV2, compileContext);
  return buildRuntimeEnvelope(base, interactionsV2, rules);
}

export function buildRulesFromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  throwIfInteractionsInvalid(interactionsV2);
  const compileContext = buildCompileContext(interactionsV2);
  return Object.freeze(mapCompiledRules(interactionsV2, compileContext));
}
