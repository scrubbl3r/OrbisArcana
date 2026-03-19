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
  finiteAtLeastOrNull,
  finiteOrNull,
} from "./orchestrator-v1-normalizers.js";

const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const ENABLED_FALSE = false;
const INTERACTIONS_VALIDATION_ERROR_PREFIX = "INTERACTIONS_V2 validation failed: ";
const VALIDATION_ERROR_DELIMITER = " | ";
const DEFAULTS_EVENT_KEY = "event";
const DEFAULTS_WAKE_WIN_KEY = "wakeWin";
const FIELD_ID = "id";
const FIELD_TYPE = "type";
const FIELD_ON = "on";
const FIELD_ALL = "all";
const FIELD_THEN = "then";
const FIELD_TTL_MS = "ttlMs";
const FIELD_SPELLS = "spells";
const FIELD_OVERRIDES = "overrides";
const FIELD_PRIORITY = "priority";
const KEY_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_INTERACTIONS_V2 = "interactionsV2";
const FIELD_BASE_RULE_ENGINE = "baseRuleEngine";
const RESERVED_ACTION_KEYS = Object.freeze(
  new Set([FIELD_TYPE, FIELD_ID, FIELD_SPELLS, FIELD_OVERRIDES, KEY_ENABLED])
);

function buildDefaultsEventById(defaultsRoot) {
  const defaultsEventById = {};
  const defaultsEvent = asObj(asObj(defaultsRoot)[DEFAULTS_EVENT_KEY]);
  for (const [rawEventId, args] of Object.entries(defaultsEvent)) {
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
  const overrides = asObj(asObj(action)[FIELD_OVERRIDES]);
  for (const [k, v] of Object.entries(overrides)) outArgs[k] = v;
  return outArgs;
}

function mapCondition(cond) {
  const c = asObj(cond);
  const type = asId(c[FIELD_TYPE]);
  const rawId = asId(c[FIELD_ID]);
  if (!type || !rawId) return null;
  const conditionId = normalizeConditionId(type, rawId);
  if (!conditionId) return null;
  return Object.freeze({ [FIELD_TYPE]: type, [FIELD_ID]: conditionId });
}

function mapWakeWinThenAction(safeAction, defaultsSafe) {
  const spells = mapDefined(asArray(safeAction[FIELD_SPELLS]), (spellId) => normalizeSpellId(spellId));
  const ttlMsRaw = Object.hasOwn(safeAction, FIELD_TTL_MS)
    ? safeAction[FIELD_TTL_MS]
    : asObj(defaultsSafe[DEFAULTS_WAKE_WIN_KEY])[FIELD_TTL_MS];
  const out = { [FIELD_TYPE]: ACTION_TYPE_WAKE_WIN, [FIELD_SPELLS]: spells };
  const ttlMsNum = finiteAtLeastOrNull(ttlMsRaw, 0);
  if (ttlMsNum != null) out[FIELD_TTL_MS] = ttlMsNum;
  setEnabledIfBoolean(out, safeAction);
  return Object.freeze(out);
}

function mapEventThenAction(safeAction, defaultsEventById) {
  const eventId = normalizeEventId(safeAction[FIELD_ID]);
  if (!eventId) return null;
  const outArgs = mergeEventArgs(defaultsEventById[eventId], safeAction);
  const out = {
    [FIELD_TYPE]: ACTION_TYPE_EVENT,
    [FIELD_ID]: eventId,
    ...outArgs,
  };
  setEnabledIfBoolean(out, safeAction);
  return Object.freeze(out);
}

function compileInteractionRule(rule, defaultsSafe, defaultsEventById) {
  const r = asObj(rule);
  const id = asText(r[FIELD_ID]) || "";
  if (!id) return null;
  const conditions = mapDefined(asArray(asObj(r[FIELD_ON])[FIELD_ALL]), mapCondition);
  const actions = mapDefined(asArray(r[FIELD_THEN]), (action) => {
    const safeAction = asObj(action);
    const type = asId(safeAction[FIELD_TYPE]);
    if (type === ACTION_TYPE_WAKE_WIN) {
      return mapWakeWinThenAction(safeAction, defaultsSafe);
    }
    if (type === ACTION_TYPE_EVENT) {
      return mapEventThenAction(safeAction, defaultsEventById);
    }
    return null;
  });
  const out = {
    [FIELD_ID]: id,
    [FIELD_ON]: Object.freeze(conditions),
    [FIELD_THEN]: Object.freeze(actions),
  };
  setEnabledIfBoolean(out, r);
  const priorityNum = finiteOrNull(r[FIELD_PRIORITY]);
  if (priorityNum != null) out[FIELD_PRIORITY] = priorityNum;
  return Object.freeze(out);
}

function buildCompiledRules(interactionsV2) {
  const validation = validateInteractionsV2(interactionsV2);
  if (!validation.ok) {
    throw new Error(
      `${INTERACTIONS_VALIDATION_ERROR_PREFIX}${validation.errors.join(VALIDATION_ERROR_DELIMITER)}`
    );
  }
  const defaultsRoot = asObj(interactionsV2[FIELD_DEFAULTS]);
  const defaultsEventById = buildDefaultsEventById(defaultsRoot);
  return mapDefined(asArray(interactionsV2[FIELD_RULES]), (rule) =>
    compileInteractionRule(rule, defaultsRoot, defaultsEventById)
  );
}

export function buildRuleEngineFromInteractionsV2(options = {}) {
  const safeOptions = asObj(options);
  const interactionsV2 = safeOptions[FIELD_INTERACTIONS_V2] || INTERACTIONS_V2;
  const baseRuleEngine = safeOptions[FIELD_BASE_RULE_ENGINE] ?? null;
  const base = asObj(baseRuleEngine);
  const rules = buildCompiledRules(interactionsV2);
  return Object.freeze({
    ...base,
    [FIELD_RULES]: Object.freeze(rules),
    [KEY_ENABLED]: interactionsV2[KEY_ENABLED] !== ENABLED_FALSE,
  });
}

export function buildRulesFromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  return Object.freeze(buildCompiledRules(interactionsV2));
}
