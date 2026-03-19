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
const DEFAULT_BUILD_OPTIONS = {};
const RESERVED_ACTION_KEYS = Object.freeze(
  new Set([FIELD_TYPE, FIELD_ID, FIELD_SPELLS, FIELD_OVERRIDES, KEY_ENABLED])
);

function getDefaultsEventSection(defaultsRoot) {
  return asObj(asObj(defaultsRoot)[DEFAULTS_EVENT_KEY]);
}

function getActionOverrides(action) {
  return asObj(asObj(action)[FIELD_OVERRIDES]);
}

function getRuleOnAllConditions(rule) {
  return asArray(asObj(asObj(rule)[FIELD_ON])[FIELD_ALL]);
}

function buildDefaultsEventById(defaultsRoot) {
  const defaultsEventById = {};
  const defaultsEvent = getDefaultsEventSection(defaultsRoot);
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
  const overrides = getActionOverrides(action);
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

function mapThenAction(action, defaultsSafe, defaultsEventById) {
  const safeAction = asObj(action);
  const type = asId(safeAction[FIELD_TYPE]);
  if (type === ACTION_TYPE_WAKE_WIN) {
    return mapWakeWinThenAction(safeAction, defaultsSafe);
  }
  if (type === ACTION_TYPE_EVENT) {
    return mapEventThenAction(safeAction, defaultsEventById);
  }
  return null;
}

function buildRuleThenActions(rule, defaultsSafe, defaultsEventById) {
  return mapDefined(asArray(asObj(rule)[FIELD_THEN]), (action) =>
    mapThenAction(action, defaultsSafe, defaultsEventById)
  );
}

function applyRulePriority(out, rule) {
  const priorityNum = finiteOrNull(asObj(rule)[FIELD_PRIORITY]);
  if (priorityNum != null) out[FIELD_PRIORITY] = priorityNum;
}

function getRuleIdText(rule) {
  return asText(asObj(rule)[FIELD_ID]) || "";
}

function buildCompiledRuleOutput(id, conditions, actions) {
  return {
    [FIELD_ID]: id,
    [FIELD_ON]: Object.freeze(conditions),
    [FIELD_THEN]: Object.freeze(actions),
  };
}

function compileInteractionRule(rule, defaultsSafe, defaultsEventById) {
  const r = asObj(rule);
  const id = getRuleIdText(r);
  if (!id) return null;
  const conditions = mapDefined(getRuleOnAllConditions(r), mapCondition);
  const actions = buildRuleThenActions(r, defaultsSafe, defaultsEventById);
  const out = buildCompiledRuleOutput(id, conditions, actions);
  setEnabledIfBoolean(out, r);
  applyRulePriority(out, r);
  return Object.freeze(out);
}

function throwInteractionsValidationErrorIfAny(validation) {
  if (validation?.ok) return;
  throw new Error(
    `${INTERACTIONS_VALIDATION_ERROR_PREFIX}${asArray(validation?.errors).join(VALIDATION_ERROR_DELIMITER)}`
  );
}

function buildCompiledRulesFromValidatedInteractions(interactionsV2, defaultsRoot) {
  const defaultsEventById = buildDefaultsEventById(defaultsRoot);
  return mapDefined(asArray(interactionsV2[FIELD_RULES]), (rule) =>
    compileInteractionRule(rule, defaultsRoot, defaultsEventById)
  );
}

function buildCompilationContext(interactionsV2) {
  return {
    defaultsRoot: asObj(interactionsV2[FIELD_DEFAULTS]),
  };
}

function buildCompiledRules(interactionsV2) {
  const validation = validateInteractionsV2(interactionsV2);
  throwInteractionsValidationErrorIfAny(validation);
  const { defaultsRoot } = buildCompilationContext(interactionsV2);
  return buildCompiledRulesFromValidatedInteractions(interactionsV2, defaultsRoot);
}

function resolveBuildOptions(options) {
  return asObj(options ?? DEFAULT_BUILD_OPTIONS);
}

function resolveInteractionsV2(optionsObj) {
  return asObj(optionsObj[FIELD_INTERACTIONS_V2] || INTERACTIONS_V2);
}

function buildBaseRuleEngineOutput(optionsObj, interactionsV2) {
  return {
    ...asObj(optionsObj[FIELD_BASE_RULE_ENGINE]),
    [KEY_ENABLED]: interactionsV2[KEY_ENABLED] !== ENABLED_FALSE,
  };
}

export function buildRuleEngineFromInteractionsV2(options = {}) {
  const safeOptions = resolveBuildOptions(options);
  const interactionsV2 = resolveInteractionsV2(safeOptions);
  const rules = buildCompiledRules(interactionsV2);
  return Object.freeze({
    ...buildBaseRuleEngineOutput(safeOptions, interactionsV2),
    [FIELD_RULES]: Object.freeze(rules),
  });
}

export function buildRulesFromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  return Object.freeze(buildCompiledRules(interactionsV2));
}
