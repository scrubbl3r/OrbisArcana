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
} from "./interactions-v2-normalizers.js";

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
const FIELD_WORDS = "words";
const FIELD_SPELLS = "spells";
const FIELD_OVERRIDES = "overrides";
const FIELD_PRIORITY = "priority";
const KEY_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_INTERACTIONS_V2 = "interactionsV2";
const FIELD_BASE_RULE_ENGINE = "baseRuleEngine";
const DEFAULT_BUILD_OPTIONS = {};
const CONDITION_TYPE_WORD = "word";
const CONDITION_TYPE_RUNTIME_SPELL = "spell";
const RESERVED_ACTION_KEYS = Object.freeze(
  new Set([FIELD_TYPE, FIELD_ID, FIELD_WORDS, FIELD_SPELLS, FIELD_OVERRIDES, KEY_ENABLED])
);

function normalizeConditionType(rawType) {
  const type = asId(rawType);
  if (type === CONDITION_TYPE_WORD) return CONDITION_TYPE_RUNTIME_SPELL;
  return type;
}

function normalizeConditionId(rawId, conditionType) {
  if (conditionType === CONDITION_TYPE_RUNTIME_SPELL) {
    const id = asId(rawId);
    if (!id || id.startsWith("spell.")) return "";
    const pref = `${CONDITION_TYPE_WORD}.`;
    return id.startsWith(pref) ? id.slice(pref.length) : id;
  }
  const id = asId(rawId);
  if (!id) return "";
  const pref = `${conditionType}.`;
  return id.startsWith(pref) ? id.slice(pref.length) : id;
}

function compileInteractionRule(rule, defaultsSafe, defaultsEventById) {
  const r = asObj(rule);
  const id = asText(r[FIELD_ID]) || "";
  if (!id) return null;
  const conditions = mapDefined(asArray(asObj(r[FIELD_ON])[FIELD_ALL]), (cond) => {
    const c = asObj(cond);
    const type = normalizeConditionType(c[FIELD_TYPE]);
    const rawId = c[FIELD_ID];
    if (!type || !rawId) return null;
    const conditionId = normalizeConditionId(rawId, type);
    if (!conditionId) return null;
    return Object.freeze({ [FIELD_TYPE]: type, [FIELD_ID]: conditionId });
  });
  const actions = mapDefined(asArray(r[FIELD_THEN]), (action) => {
    const safeAction = asObj(action);
    const type = asId(safeAction[FIELD_TYPE]);
    if (type === ACTION_TYPE_WAKE_WIN) {
      const wordsRaw = Object.hasOwn(safeAction, FIELD_WORDS) ? safeAction[FIELD_WORDS] : safeAction[FIELD_SPELLS];
      const words = mapDefined(asArray(wordsRaw), (wordId) => normalizeSpellId(wordId));
      const ttlMsRaw = Object.hasOwn(safeAction, FIELD_TTL_MS)
        ? safeAction[FIELD_TTL_MS]
        : asObj(defaultsSafe[DEFAULTS_WAKE_WIN_KEY])[FIELD_TTL_MS];
      const out = { [FIELD_TYPE]: ACTION_TYPE_WAKE_WIN, [FIELD_SPELLS]: words };
      out[FIELD_WORDS] = words;
      const ttlMsNum = finiteAtLeastOrNull(ttlMsRaw, 0);
      if (ttlMsNum != null) out[FIELD_TTL_MS] = ttlMsNum;
      setEnabledIfBoolean(out, safeAction);
      return Object.freeze(out);
    }
    if (type === ACTION_TYPE_EVENT) {
      const eventId = normalizeEventId(safeAction[FIELD_ID]);
      if (!eventId) return null;
      const outArgs = {
        ...asObj(defaultsEventById[eventId]),
      };
      for (const [k, v] of Object.entries(safeAction)) {
        if (RESERVED_ACTION_KEYS.has(k)) continue;
        outArgs[k] = v;
      }
      const overrides = asObj(asObj(safeAction)[FIELD_OVERRIDES]);
      for (const [k, v] of Object.entries(overrides)) outArgs[k] = v;
      const out = {
        [FIELD_TYPE]: ACTION_TYPE_EVENT,
        [FIELD_ID]: eventId,
        ...outArgs,
      };
      setEnabledIfBoolean(out, safeAction);
      return Object.freeze(out);
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
  if (!validation?.ok) {
    throw new Error(
      `${INTERACTIONS_VALIDATION_ERROR_PREFIX}${asArray(validation?.errors).join(VALIDATION_ERROR_DELIMITER)}`
    );
  }
  const defaultsRoot = asObj(interactionsV2[FIELD_DEFAULTS]);
  const defaultsEventById = {};
  const defaultsEvent = asObj(asObj(defaultsRoot)[DEFAULTS_EVENT_KEY]);
  for (const [rawEventId, args] of Object.entries(defaultsEvent)) {
    const normalizedEventId = normalizeEventId(rawEventId);
    if (!normalizedEventId) continue;
    defaultsEventById[normalizedEventId] = asObj(args);
  }
  return mapDefined(asArray(interactionsV2[FIELD_RULES]), (rule) =>
    compileInteractionRule(rule, defaultsRoot, defaultsEventById)
  );
}

export function buildRuleEngineFromInteractionsV2(options = {}) {
  const safeOptions = asObj(options ?? DEFAULT_BUILD_OPTIONS);
  const interactionsV2 = asObj(safeOptions[FIELD_INTERACTIONS_V2] || INTERACTIONS_V2);
  const baseRuleEngine = Object.hasOwn(safeOptions, FIELD_BASE_RULE_ENGINE)
    ? asObj(safeOptions[FIELD_BASE_RULE_ENGINE])
    : {};
  const rules = buildCompiledRules(interactionsV2);
  return Object.freeze({
    ...baseRuleEngine,
    [KEY_ENABLED]: interactionsV2[KEY_ENABLED] !== ENABLED_FALSE,
    [FIELD_RULES]: Object.freeze(rules),
  });
}

export function buildRulesFromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  return Object.freeze(buildCompiledRules(interactionsV2));
}
