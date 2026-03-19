import { ORCHESTRATOR_V1 } from "./orchestrator-v1.js";
import { validateOrchestratorV1 } from "./validate-orchestrator-v1.js";
import {
  asOpenObject,
  asTriggerObject,
  asObj,
  asText,
  mapDefined,
  setEnabledIfBoolean,
  isStringOrArray,
  ORCHESTRATOR_MIN_MATCH_WINDOW_MS,
  OPEN_TTL_KEYS,
  RULE_COOLDOWN_KEYS,
  RULE_MATCH_WINDOW_KEYS,
  RULE_PRIORITY_KEYS,
  normalizeSpellId,
  normalizeEventId,
  normalizeIds,
  parseOnSelectorList,
  collectOnEntriesFromObjectSelectors,
  collectRuleTriggerEntries,
  getMergedDefaultTriggerEntries,
  finiteAtLeastOrNull,
  finiteOrNull,
} from "./orchestrator-v1-normalizers.js";

const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const RULE_ENGINE_V2_VERSION = "2";
const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});
const ENABLED_FALSE = false;
const ORCHESTRATOR_VALIDATION_ERROR_PREFIX = "ORCHESTRATOR_V1 validation failed: ";
const VALIDATION_ERROR_DELIMITER = " | ";
const FIELD_VERSION = "version";
const FIELD_TYPE = "type";
const FIELD_EVENT = "event";
const FIELD_ARGS = "args";
const FIELD_SPELLS = "spells";
const FIELD_TTL_MS = "ttlMs";
const FIELD_ID = "id";
const FIELD_ON = "on";
const FIELD_THEN = "then";
const RULE_FIELD_OPEN = "open";
const DEFAULTS_FIELD_OPEN = "open";
const DEFAULTS_FIELD_RULE = "rule";
const RULE_OUTPUT_PRIORITY = "priority";
const RULE_OUTPUT_COOLDOWN_MS = "cooldownMs";
const RULE_OUTPUT_MATCH_WINDOW_MS = "matchWindowMs";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_ENABLED = "enabled";
const FIELD_BASE_RULE_ENGINE = "baseRuleEngine";
const FIELD_ORCHESTRATOR_V1 = "orchestratorV1";
const FIELD_SIGNALS = "signals";
const FIELD_WINDOWS = "windows";
const FIELD_EVENTS = "events";
const FIELD_EVENT_RUNTIME_BINDINGS = "eventRuntimeBindings";

function assignNumericFromSources(out, targetKey, sources, sourceKeys, min = null) {
  let rawValue;
  for (const source of sources) {
    for (const key of sourceKeys) {
      if (Object.hasOwn(source, key)) {
        rawValue = source[key];
        break;
      }
    }
    if (rawValue !== undefined) break;
  }
  const n = min == null
    ? finiteOrNull(rawValue)
    : finiteAtLeastOrNull(rawValue, min);
  if (n != null) out[targetKey] = n;
}

function buildOpenAction(openObj, defaultsOpen) {
  const openSpells = normalizeIds(asObj(openObj)[FIELD_SPELLS], normalizeSpellId);
  if (!openSpells.length) return null;
  const out = {
    [FIELD_TYPE]: ACTION_TYPE_WAKE_WIN,
    [FIELD_SPELLS]: openSpells,
  };
  setEnabledIfBoolean(out, openObj);
  assignNumericFromSources(
    out,
    FIELD_TTL_MS,
    [openObj, defaultsOpen],
    OPEN_TTL_KEYS,
    0
  );
  return Object.freeze(out);
}

function buildTriggerAction(trigger, defaultsTriggerByEvent) {
  const triggerObj = asTriggerObject(trigger);
  const eventId = normalizeEventId(triggerObj[FIELD_EVENT]);
  if (!eventId) return null;
  const out = {
    [FIELD_TYPE]: ACTION_TYPE_EVENT,
    [FIELD_ID]: eventId,
    ...asObj(defaultsTriggerByEvent[eventId]),
    ...asObj(triggerObj[FIELD_ARGS]),
  };
  setEnabledIfBoolean(out, triggerObj);
  return Object.freeze(out);
}

export function buildRuleEngineFromOrchestratorV1(options = {}) {
  const safeOptions = asObj(options);
  const orchestratorObj = asObj(safeOptions[FIELD_ORCHESTRATOR_V1] || ORCHESTRATOR_V1);
  const validationErrorText = validateOrchestratorV1(orchestratorObj).join(VALIDATION_ERROR_DELIMITER);
  if (validationErrorText) {
    throw new Error(`${ORCHESTRATOR_VALIDATION_ERROR_PREFIX}${validationErrorText}`);
  }
  const defaultsObj = asObj(orchestratorObj[FIELD_DEFAULTS]);
  const defaultsOpen = asObj(defaultsObj[DEFAULTS_FIELD_OPEN]);
  const defaultsRule = asObj(defaultsObj[DEFAULTS_FIELD_RULE]);
  const defaultsTriggerByEvent = {};
  for (const [eventIdRaw, args] of getMergedDefaultTriggerEntries(defaultsObj)) {
    const eventId = normalizeEventId(eventIdRaw);
    if (!eventId) continue;
    defaultsTriggerByEvent[eventId] = asObj(args);
  }
  return Object.freeze({
    ...asObj(safeOptions[FIELD_BASE_RULE_ENGINE]),
    [FIELD_VERSION]: RULE_ENGINE_V2_VERSION,
    [FIELD_ENABLED]: orchestratorObj[FIELD_ENABLED] !== ENABLED_FALSE,
    [FIELD_SIGNALS]: EMPTY_ARRAY,
    [FIELD_WINDOWS]: EMPTY_ARRAY,
    [FIELD_EVENTS]: EMPTY_ARRAY,
    [FIELD_RULES]: Object.freeze(mapDefined(orchestratorObj[FIELD_RULES], (rule) => {
      const safeRule = asObj(rule);
      const id = asText(safeRule[FIELD_ID]) || "";
      if (!id) return null;
      const onValue = safeRule[FIELD_ON];
      const on = isStringOrArray(onValue)
        ? mapDefined(parseOnSelectorList(onValue), (selector) => (selector?.[FIELD_ID] ? selector : null))
        : collectOnEntriesFromObjectSelectors(onValue);
      if (!on.length) return null;
      const openObj = asOpenObject(safeRule[RULE_FIELD_OPEN]);
      const openAction = buildOpenAction(openObj, defaultsOpen);
      const triggerActions = mapDefined(collectRuleTriggerEntries(safeRule), (trigger) =>
        buildTriggerAction(trigger, defaultsTriggerByEvent)
      );
      const out = {
        [FIELD_ID]: id,
        [FIELD_ON]: Object.freeze(on),
        [FIELD_THEN]: Object.freeze(openAction ? [openAction, ...triggerActions] : triggerActions),
      };
      setEnabledIfBoolean(out, safeRule);
      assignNumericFromSources(out, RULE_OUTPUT_PRIORITY, [safeRule, defaultsRule], RULE_PRIORITY_KEYS);
      assignNumericFromSources(out, RULE_OUTPUT_COOLDOWN_MS, [safeRule, defaultsRule], RULE_COOLDOWN_KEYS, 0);
      assignNumericFromSources(
        out,
        RULE_OUTPUT_MATCH_WINDOW_MS,
        [safeRule, defaultsRule],
        RULE_MATCH_WINDOW_KEYS,
        ORCHESTRATOR_MIN_MATCH_WINDOW_MS
      );
      return Object.freeze(out);
    })),
    [FIELD_EVENT_RUNTIME_BINDINGS]: EMPTY_OBJECT,
  });
}
