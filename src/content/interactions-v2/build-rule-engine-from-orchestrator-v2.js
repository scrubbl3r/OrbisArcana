import { ORCHESTRATOR_V2 } from "./orchestrator-v2.js";
import { validateOrchestratorV2 } from "./validate-orchestrator-v2.js";
import { EVENT_RUNTIME_BINDINGS_BY_ID } from "../spell-rules/event-runtime-bindings.js";
import {
  asArray,
  asObj,
  asSelectorList,
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
const DEFAULT_WAKE_WINDOW_ID = "wake_win";
const ENABLED_FALSE = false;
const ORCHESTRATOR_V2_VALIDATION_ERROR_PREFIX = "ORCHESTRATOR_V2 validation failed: ";
const VALIDATION_ERROR_DELIMITER = " | ";
const FIELD_TYPE = "type";
const FIELD_ID = "id";
const FIELD_ON = "on";
const FIELD_THEN = "then";
const FIELD_DEFAULTS = "defaults";
const FIELD_GROUPS = "groups";
const FIELD_WAKE = "wake";
const FIELD_RULES = "rules";
const FIELD_TRIGGER = "trigger";
const FIELD_OPEN = "open";
const FIELD_WORDS = "words";
const FIELD_SPELLS = "spells";
const FIELD_ENABLED = "enabled";
const FIELD_REQUIRES = "requires";
const FIELD_CONSUME = "consume";
const FIELD_COOLDOWN_MS = "cooldownMs";
const FIELD_MATCH_WINDOW_MS = "matchWindowMs";
const FIELD_PRIORITY = "priority";
const FIELD_ORCHESTRATOR_V2 = "orchestratorV2";
const FIELD_BASE_RULE_ENGINE = "baseRuleEngine";
const DEFAULTS_OPEN_KEY = "open";
const DEFAULTS_RULE_KEY = "rule";
const DEFAULTS_TRIGGER_KEY = "trigger";
const FIELD_TTL_MS = "ttlMs";
const RESERVED_TRIGGER_KEYS = Object.freeze(
  new Set([FIELD_ENABLED])
);

function parseStringOrArray(raw) {
  return asSelectorList(raw)
    .map((v) => asText(v))
    .filter(Boolean);
}

function parseWordRefs(rawWords, groups) {
  const tokens = parseStringOrArray(rawWords);
  const out = [];
  for (const token of tokens) {
    if (token.startsWith("@")) {
      const groupName = token.slice(1);
      const groupWords = asArray(asObj(groups)[groupName]);
      for (const groupWord of groupWords) {
        const normalized = normalizeSpellId(groupWord);
        if (normalized) out.push(normalized);
      }
      continue;
    }
    const normalized = normalizeSpellId(token);
    if (normalized) out.push(normalized);
  }
  return out;
}

function compileWakeSection(wakeRaw, groups) {
  if (wakeRaw == null) return null;
  const wakeObj = isPlainWakeObject(wakeRaw) ? asObj(wakeRaw) : null;
  const wordsRaw = wakeObj
    ? (Object.hasOwn(wakeObj, FIELD_WORDS) ? wakeObj[FIELD_WORDS] : wakeObj[FIELD_SPELLS])
    : wakeRaw;
  const words = Array.from(new Set(parseWordRefs(wordsRaw, groups)));
  if (!words.length) return null;
  const out = {
    [FIELD_WORDS]: words,
    [FIELD_SPELLS]: words,
  };
  if (wakeObj) {
    const ttlMs = finiteAtLeastOrNull(wakeObj[FIELD_TTL_MS], 0);
    if (ttlMs != null) out[FIELD_TTL_MS] = ttlMs;
  }
  if (wakeObj) setEnabledIfBoolean(out, wakeObj);
  return Object.freeze(out);
}

function isPlainWakeObject(wakeRaw) {
  return !!(wakeRaw && typeof wakeRaw === "object" && !Array.isArray(wakeRaw));
}

function compileOnSelectors(onRaw) {
  const on = asObj(onRaw);
  const conditions = [];
  const wordRefsRaw = Object.hasOwn(on, "word") ? on.word : on.spell;
  for (const rawWord of parseStringOrArray(wordRefsRaw)) {
    const id = normalizeSpellId(rawWord);
    if (!id) continue;
    conditions.push(Object.freeze({ type: "word", id }));
  }
  for (const rawGesture of parseStringOrArray(on.gesture)) {
    const id = asText(rawGesture).toLowerCase();
    if (!id) continue;
    conditions.push(Object.freeze({ type: "gesture", id }));
  }
  for (const rawOrbState of parseStringOrArray(on.orb_state)) {
    const id = asText(rawOrbState).toLowerCase();
    if (!id) continue;
    conditions.push(Object.freeze({ type: "orb_state", id }));
  }
  return conditions;
}

function compileOpenAction(openRaw, defaultsOpen, groups) {
  if (!openRaw || typeof openRaw !== "object") return null;
  const open = asObj(openRaw);
  const wordsRaw = Object.hasOwn(open, FIELD_WORDS) ? open[FIELD_WORDS] : open[FIELD_SPELLS];
  const words = parseWordRefs(wordsRaw, groups);
  if (!words.length) return null;
  const out = {
    [FIELD_TYPE]: ACTION_TYPE_WAKE_WIN,
    [FIELD_ID]: DEFAULT_WAKE_WINDOW_ID,
    [FIELD_WORDS]: words,
    [FIELD_SPELLS]: words,
  };
  const ttlMsRaw = Object.hasOwn(open, FIELD_TTL_MS)
    ? open[FIELD_TTL_MS]
    : asObj(defaultsOpen)[FIELD_TTL_MS];
  const ttlMs = finiteAtLeastOrNull(ttlMsRaw, 0);
  if (ttlMs != null) out[FIELD_TTL_MS] = ttlMs;
  if (asText(open[FIELD_ID])) out.windowId = asText(open[FIELD_ID]);
  setEnabledIfBoolean(out, open);
  return Object.freeze(out);
}

function compileTriggerActions(triggerRaw, defaultsTriggerByEvent) {
  if (!triggerRaw) return [];
  if (typeof triggerRaw === "string" || Array.isArray(triggerRaw)) {
    return mapDefined(parseStringOrArray(triggerRaw), (rawEventId) => {
      const eventId = normalizeEventId(rawEventId);
      if (!eventId) return null;
      return Object.freeze({
        [FIELD_TYPE]: ACTION_TYPE_EVENT,
        [FIELD_ID]: eventId,
        ...asObj(defaultsTriggerByEvent[eventId]),
      });
    });
  }
  const trigger = asObj(triggerRaw);
  return mapDefined(Object.entries(trigger), ([rawEventId, argRaw]) => {
    const eventId = normalizeEventId(rawEventId);
    if (!eventId) return null;
    const out = {
      [FIELD_TYPE]: ACTION_TYPE_EVENT,
      [FIELD_ID]: eventId,
      ...asObj(defaultsTriggerByEvent[eventId]),
    };
    if (typeof argRaw === "boolean") {
      if (argRaw === false) out[FIELD_ENABLED] = false;
      return Object.freeze(out);
    }
    if (argRaw && typeof argRaw === "object" && !Array.isArray(argRaw)) {
      if (typeof argRaw[FIELD_ENABLED] === "boolean") {
        out[FIELD_ENABLED] = argRaw[FIELD_ENABLED];
      }
      for (const [k, v] of Object.entries(asObj(argRaw))) {
        if (RESERVED_TRIGGER_KEYS.has(k)) continue;
        out[k] = v;
      }
    }
    return Object.freeze(out);
  });
}

function compileRule(ruleRaw, defaultsSafe, groups) {
  const rule = asObj(ruleRaw);
  const id = asText(rule[FIELD_ID]);
  if (!id) return null;
  const on = compileOnSelectors(rule[FIELD_ON]);
  if (!on.length) return null;
  const defaultsOpen = asObj(defaultsSafe[DEFAULTS_OPEN_KEY]);
  const defaultsRule = asObj(defaultsSafe[DEFAULTS_RULE_KEY]);
  const defaultsTriggerByEvent = asObj(defaultsSafe[DEFAULTS_TRIGGER_KEY]);
  const openAction = compileOpenAction(rule[FIELD_OPEN], defaultsOpen, groups);
  const triggerActions = compileTriggerActions(rule[FIELD_TRIGGER], defaultsTriggerByEvent);
  const actions = openAction ? [openAction, ...triggerActions] : triggerActions;
  if (!actions.length) return null;

  const out = {
    [FIELD_ID]: id,
    [FIELD_ON]: Object.freeze(on),
    [FIELD_THEN]: Object.freeze(actions),
  };
  setEnabledIfBoolean(out, rule);
  const cooldownMs = finiteAtLeastOrNull(
    Object.hasOwn(rule, FIELD_COOLDOWN_MS) ? rule[FIELD_COOLDOWN_MS] : defaultsRule[FIELD_COOLDOWN_MS],
    0
  );
  if (cooldownMs != null) out[FIELD_COOLDOWN_MS] = cooldownMs;
  const matchWindowMs = finiteAtLeastOrNull(
    Object.hasOwn(rule, FIELD_MATCH_WINDOW_MS) ? rule[FIELD_MATCH_WINDOW_MS] : defaultsRule[FIELD_MATCH_WINDOW_MS],
    100
  );
  if (matchWindowMs != null) out[FIELD_MATCH_WINDOW_MS] = matchWindowMs;
  const priority = finiteOrNull(
    Object.hasOwn(rule, FIELD_PRIORITY) ? rule[FIELD_PRIORITY] : defaultsRule[FIELD_PRIORITY]
  );
  if (priority != null) out[FIELD_PRIORITY] = priority;

  const requires = parseStringOrArray(rule[FIELD_REQUIRES]);
  if (requires.length) out[FIELD_REQUIRES] = Object.freeze(requires);
  const consume = parseStringOrArray(rule[FIELD_CONSUME]);
  if (consume.length) out[FIELD_CONSUME] = Object.freeze(consume);

  return Object.freeze(out);
}

function buildCompiledRules(orchestratorV2) {
  const result = validateOrchestratorV2(orchestratorV2);
  if (!result || result.ok !== true) {
    throw new Error(
      `${ORCHESTRATOR_V2_VALIDATION_ERROR_PREFIX}${asArray(result && result.errors).join(VALIDATION_ERROR_DELIMITER)}`
    );
  }
  const defaults = asObj(orchestratorV2[FIELD_DEFAULTS]);
  const groups = asObj(orchestratorV2[FIELD_GROUPS]);
  const defaultsTriggerRaw = asObj(defaults[DEFAULTS_TRIGGER_KEY]);
  const defaultsTriggerByEvent = Object.entries(defaultsTriggerRaw).reduce((acc, [rawEventId, args]) => {
    const eventId = normalizeEventId(rawEventId);
    if (!eventId) return acc;
    acc[eventId] = asObj(args);
    return acc;
  }, {});
  const defaultsSafe = {
    [DEFAULTS_OPEN_KEY]: asObj(defaults[DEFAULTS_OPEN_KEY]),
    [DEFAULTS_RULE_KEY]: asObj(defaults[DEFAULTS_RULE_KEY]),
    [DEFAULTS_TRIGGER_KEY]: defaultsTriggerByEvent,
  };
  return mapDefined(asArray(orchestratorV2[FIELD_RULES]), (rule) =>
    compileRule(rule, defaultsSafe, groups)
  );
}

export function buildRuleEngineFromOrchestratorV2(options = {}) {
  const safeOptions = asObj(options);
  const orchestratorV2 = asObj(safeOptions[FIELD_ORCHESTRATOR_V2] || ORCHESTRATOR_V2);
  const baseRuleEngine = asObj(safeOptions[FIELD_BASE_RULE_ENGINE]);
  const baseEventRuntimeBindings = asObj(baseRuleEngine.eventRuntimeBindings);
  const rules = buildCompiledRules(orchestratorV2);
  const groups = asObj(orchestratorV2[FIELD_GROUPS]);
  const wake = compileWakeSection(orchestratorV2[FIELD_WAKE], groups);
  return Object.freeze({
    ...baseRuleEngine,
    [FIELD_ENABLED]: orchestratorV2[FIELD_ENABLED] !== ENABLED_FALSE,
    eventRuntimeBindings: Object.freeze({
      ...(EVENT_RUNTIME_BINDINGS_BY_ID && typeof EVENT_RUNTIME_BINDINGS_BY_ID === "object"
        ? EVENT_RUNTIME_BINDINGS_BY_ID
        : Object.create(null)),
      ...baseEventRuntimeBindings,
    }),
    ...(wake ? { [FIELD_WAKE]: wake } : {}),
    [FIELD_RULES]: Object.freeze(rules),
  });
}

export function buildRulesFromOrchestratorV2(orchestratorV2 = ORCHESTRATOR_V2) {
  return Object.freeze(buildCompiledRules(orchestratorV2));
}
