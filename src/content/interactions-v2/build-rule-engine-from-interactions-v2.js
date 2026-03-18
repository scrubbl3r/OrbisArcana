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
const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";

function buildDefaultsEventById(defaultsRoot) {
  const defaultsEventById = {};
  for (const [rawEventId, args] of Object.entries(asObj(asObj(defaultsRoot).event))) {
    const normalizedEventId = normalizeEventId(rawEventId);
    if (!normalizedEventId) continue;
    defaultsEventById[normalizedEventId] = asObj(args);
  }
  return defaultsEventById;
}

function normalizeConditionId(type, rawId) {
  const pref = `${type}.`;
  if (!rawId.startsWith(pref)) return rawId;
  return rawId.slice(pref.length);
}

function mergeEventArgs(defaultArgs, action) {
  const outArgs = {
    ...asObj(defaultArgs),
  };
  for (const [k, v] of Object.entries(asObj(action))) {
    if (RESERVED_ACTION_KEYS.has(k)) continue;
    outArgs[k] = v;
  }
  const overrides = asObj(asObj(action).overrides);
  for (const [k, v] of Object.entries(overrides)) outArgs[k] = v;
  return outArgs;
}

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function finiteAtLeastOrNull(value, min) {
  const n = finiteOrNull(value);
  return n == null ? null : Math.max(min, n);
}

function mapCondition(cond) {
  const c = asObj(cond);
  const type = asId(c.type);
  const rawId = asId(c.id);
  if (!type || !rawId) return null;
  const conditionId = normalizeConditionId(type, rawId);
  if (!conditionId) return null;
  return Object.freeze({ type, id: conditionId });
}

function mapConditions(onAll) {
  return mapDefined(onAll, mapCondition);
}

function resolveWakeWinTtlMs(action, defaultsSafe) {
  if (Object.hasOwn(action, "ttlMs")) return action.ttlMs;
  return asObj(defaultsSafe.wakeWin).ttlMs;
}

function mapThenAction(action, defaultsSafe, defaultsEventById) {
  const safeAction = asObj(action);
  const type = asId(safeAction.type);
  if (type === ACTION_TYPE_WAKE_WIN) {
    const spells = mapDefined(asArray(safeAction.spells), (spellId) => normalizeSpellId(spellId));
    const ttlMsRaw = resolveWakeWinTtlMs(safeAction, defaultsSafe);
    const out = { type: ACTION_TYPE_WAKE_WIN, spells };
    const ttlMsNum = finiteAtLeastOrNull(ttlMsRaw, 0);
    if (ttlMsNum != null) out.ttlMs = ttlMsNum;
    setEnabledIfBoolean(out, safeAction);
    return Object.freeze(out);
  }
  if (type === ACTION_TYPE_EVENT) {
    const eventId = normalizeEventId(safeAction.id);
    if (!eventId) return null;
    const outArgs = mergeEventArgs(defaultsEventById[eventId], safeAction);
    const out = {
      type: ACTION_TYPE_EVENT,
      id: eventId,
      ...outArgs,
    };
    setEnabledIfBoolean(out, safeAction);
    return Object.freeze(out);
  }
  return null;
}

function mapThenActions(thenActions, defaultsSafe, defaultsEventById) {
  return mapDefined(thenActions, (action) =>
    mapThenAction(action, defaultsSafe, defaultsEventById)
  );
}

function applyCompiledRulePriority(out, rule) {
  const priorityNum = finiteOrNull(rule.priority);
  if (priorityNum != null) out.priority = priorityNum;
}

function compileInteractionRule(rule, defaultsSafe, defaultsEventById) {
  const r = asObj(rule);
  const id = asText(r.id);
  if (!id) return null;
  const onAll = asArray(asObj(r.on).all);
  const conditions = mapConditions(onAll);
  const thenActions = asArray(r.then);
  const actions = mapThenActions(thenActions, defaultsSafe, defaultsEventById);
  const out = { id, on: Object.freeze(conditions), then: Object.freeze(actions) };
  setEnabledIfBoolean(out, r);
  applyCompiledRulePriority(out, r);
  return Object.freeze(out);
}

function buildCompiledRules(interactionsV2) {
  const validation = validateInteractionsV2(interactionsV2);
  if (!validation.ok) {
    throw new Error(`INTERACTIONS_V2 validation failed: ${validation.errors.join(" | ")}`);
  }
  const defaultsRoot = asObj(interactionsV2.defaults);
  const defaultsEventById = buildDefaultsEventById(defaultsRoot);
  return mapDefined(asArray(interactionsV2.rules), (rule) =>
    compileInteractionRule(rule, defaultsRoot, defaultsEventById)
  );
}

export function buildRuleEngineFromInteractionsV2(options = {}) {
  const {
    interactionsV2 = INTERACTIONS_V2,
    baseRuleEngine = null,
  } = options;
  const base = asObj(baseRuleEngine);
  const rules = buildCompiledRules(interactionsV2);
  return Object.freeze({
    ...base,
    rules: Object.freeze(rules),
    enabled: interactionsV2.enabled !== false,
  });
}

export function buildRulesFromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  return Object.freeze(buildCompiledRules(interactionsV2));
}
