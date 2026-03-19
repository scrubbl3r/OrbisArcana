import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asOpenObject,
  asTriggerObject,
  hasNonEmptyArray,
  asObj,
  asText,
  isPlainObject,
  isStringOrArray,
  ORCHESTRATOR_MIN_MATCH_WINDOW_MS,
  OPEN_TTL_KEYS,
  RULE_COOLDOWN_KEYS,
  RULE_MATCH_WINDOW_KEYS,
  RULE_PRIORITY_KEY,
  RULE_PRIORITY_KEYS,
  TRIGGER_SOURCE_KEYS,
  normalizeSpellId,
  normalizeEventId,
  ON_SELECTOR_ALLOWED_KEYS,
  parseOnSelectorList,
  asSelectorList,
  requireNonEmptyArray,
  pushBooleanEnabledErrorWhenPresent,
  validateOptionalObjectSection,
  collectOnEntriesFromObjectSelectors,
  collectRuleTriggerEntries,
  getMergedDefaultTriggerEntries,
  pushUnsupportedKeys,
} from "./orchestrator-v1-normalizers.js";

const ROOT_CONTEXT = "ORCHESTRATOR_V1";
const ORCHESTRATOR_VERSION = "1";
const TYPE_BOOLEAN = "boolean";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_OPEN_CONTEXT = `${DEFAULTS_CONTEXT}.open`;
const DEFAULTS_TRIGGER_CONTEXT = `${DEFAULTS_CONTEXT}.trigger`;
const DEFAULTS_RULE_CONTEXT = `${DEFAULTS_CONTEXT}.rule`;
const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_ID = "id";
const FIELD_TYPE = "type";
const FIELD_ON = "on";
const DEFAULTS_KEY_OPEN = "open";
const DEFAULTS_KEY_RULE = "rule";
const RULE_FIELD_OPEN = "open";
const OPEN_FIELD_SPELLS = "spells";
const RULE_SECTION_ON = "on";
const RULE_SECTION_OPEN = "open";
const RULE_SECTION_TRIGGER = "trigger";
const TRIGGER_FIELD_EVENT = "event";
const TRIGGER_FIELD_ARGS = "args";
const LABEL_ON_SELECTOR = "on selector";
const LABEL_OPEN_OR_TRIGGER_ACTIONS = "open and/or trigger actions";
const ERR_REF_UNKNOWN_OR_INACTIVE_SPELL = "references inactive or unknown spell id";
const ERR_REF_UNKNOWN_GESTURE = "references unknown gesture id";
const ERR_REF_UNKNOWN_ORB_STATE = "references unknown orb_state id";
const CONDITION_TYPE_SPELL = "spell";
const CONDITION_TYPE_GESTURE = "gesture";
const CONDITION_TYPE_ORB_STATE = "orb_state";
const SIGNAL_PREFIX_GESTURE = "gesture.";
const SIGNAL_PREFIX_ORB_STATE = "orb_state.";
const SUPPORTED_ON_SELECTOR_TYPES = Object.freeze([
  CONDITION_TYPE_SPELL,
  CONDITION_TYPE_GESTURE,
  CONDITION_TYPE_ORB_STATE,
]);
const ROOT_ALLOWED_KEYS = new Set([FIELD_VERSION, FIELD_ENABLED, FIELD_DEFAULTS, FIELD_RULES]);
const RULE_ALLOWED_KEYS = new Set([
  FIELD_ID,
  FIELD_ON,
  RULE_FIELD_OPEN,
  ...TRIGGER_SOURCE_KEYS,
  FIELD_ENABLED,
  ...RULE_PRIORITY_KEYS,
  ...RULE_COOLDOWN_KEYS,
  ...RULE_MATCH_WINDOW_KEYS,
]);
const OPEN_ALLOWED_KEYS = new Set([OPEN_FIELD_SPELLS, ...OPEN_TTL_KEYS, FIELD_ENABLED]);
const TRIGGER_ALLOWED_KEYS = new Set([TRIGGER_FIELD_EVENT, FIELD_ENABLED, TRIGGER_FIELD_ARGS]);
const DEFAULTS_ALLOWED_KEYS = new Set([DEFAULTS_KEY_OPEN, ...TRIGGER_SOURCE_KEYS, DEFAULTS_KEY_RULE]);
const DEFAULTS_RULE_ALLOWED_KEYS = new Set([
  ...RULE_COOLDOWN_KEYS,
  ...RULE_MATCH_WINDOW_KEYS,
  ...RULE_PRIORITY_KEYS,
]);

function pushFiniteConstraintErrorWhenPresent(
  errors,
  context,
  obj,
  key,
  isValid,
  errorMessage
) {
  const source = asObj(obj);
  if (!Object.hasOwn(source, key)) return;
  if (!isValid(Number(source[key]))) {
    errors.push(
      `${context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`} ${errorMessage}`
    );
  }
}

function validateRuleNumericKeys(errors, context, target) {
  pushFiniteConstraintErrorWhenPresent(
    errors,
    context,
    target,
    RULE_PRIORITY_KEY,
    Number.isFinite,
    "must be a finite number when present"
  );
  for (const key of RULE_COOLDOWN_KEYS) {
    pushFiniteConstraintErrorWhenPresent(
      errors,
      context,
      target,
      key,
      (n) => Number.isFinite(n) && n >= 0,
      "must be a finite number >= 0 when present"
    );
  }
  for (const key of RULE_MATCH_WINDOW_KEYS) {
    pushFiniteConstraintErrorWhenPresent(
      errors,
      context,
      target,
      key,
      (n) => Number.isFinite(n) && n >= ORCHESTRATOR_MIN_MATCH_WINDOW_MS,
      `must be a finite number >= ${ORCHESTRATOR_MIN_MATCH_WINDOW_MS} when present`
    );
  }
}

function validateOpenTtlKeys(errors, context, target) {
  for (const key of OPEN_TTL_KEYS) {
    pushFiniteConstraintErrorWhenPresent(
      errors,
      context,
      target,
      key,
      (n) => Number.isFinite(n) && n >= 0,
      "must be a finite number >= 0 when present"
    );
  }
}

function makeRuleContext(ruleId, section = "") {
  return section ? `rule ${ruleId} ${section}` : `rule ${ruleId}`;
}

function collectKnownSignalIds(prefix) {
  return new Set(
    Object.keys((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
      ? SIGNAL_DEFINITIONS_BY_ID
      : {})
      .filter((signalId) => typeof signalId === "string" && signalId.startsWith(prefix))
      .map((signalId) => signalId.slice(prefix.length))
      .filter(Boolean)
  );
}

const isKnownGestureId = (() => {
  const knownIds = collectKnownSignalIds(SIGNAL_PREFIX_GESTURE);
  return (id) => knownIds.has(id);
})();
const isKnownOrbStateId = (() => {
  const knownIds = collectKnownSignalIds(SIGNAL_PREFIX_ORB_STATE);
  return (id) => knownIds.has(id);
})();

function validateRuleEntry(errors, seenRuleIds, rawRule) {
  const rule = asObj(rawRule);
  const ruleId = asText(rule[FIELD_ID]);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return;
  }
  if (seenRuleIds.has(ruleId)) errors.push(`${ROOT_CONTEXT}.rules contains duplicate id: ${ruleId}`);
  seenRuleIds.add(ruleId);

  const ruleContext = makeRuleContext(ruleId);
  pushUnsupportedKeys(errors, ruleContext, rule, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, rule);
  validateRuleNumericKeys(errors, ruleContext, rule);
  const onContext = makeRuleContext(ruleId, RULE_SECTION_ON);
  const onEntries = isStringOrArray(rule[FIELD_ON])
    ? parseOnSelectorList(rule[FIELD_ON], { invalidAsEmptyObject: true })
    : (() => {
      const on = asObj(rule[FIELD_ON]);
      pushUnsupportedKeys(errors, onContext, on, ON_SELECTOR_ALLOWED_KEYS);
      return collectOnEntriesFromObjectSelectors(on, { includeRaw: true });
    })();
  const seenOn = new Set();
  if (requireNonEmptyArray(errors, onEntries, `${ruleContext} must define on selectors`)) {
    for (const entry of onEntries) {
      const type = asText(entry?.[FIELD_TYPE]).toLowerCase();
      const id = asText(entry?.[FIELD_ID]).toLowerCase();
      const rawId = entry.raw || id;
      if (!SUPPORTED_ON_SELECTOR_TYPES.includes(type)) {
        errors.push(`${ruleContext} has unsupported ${LABEL_ON_SELECTOR} type`);
        continue;
      }
      if (!id) {
        errors.push(`${ruleContext} has empty on.${type}`);
        continue;
      }
      if (seenOn.has(`${type}.${id}`)) {
        errors.push(`${ruleContext} contains duplicate ${LABEL_ON_SELECTOR}: ${type}.${id}`);
        continue;
      }
      seenOn.add(`${type}.${id}`);
      if (type === CONDITION_TYPE_SPELL && !Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id)) {
        errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_OR_INACTIVE_SPELL}: ${rawId}`);
      } else if (type === CONDITION_TYPE_GESTURE && !isKnownGestureId(id)) {
        errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_GESTURE}: ${rawId}`);
      } else if (type === CONDITION_TYPE_ORB_STATE && !isKnownOrbStateId(id)) {
        errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_ORB_STATE}: ${rawId}`);
      }
    }
  }
  const hasOpenAction = Object.hasOwn(rule, RULE_FIELD_OPEN);
  const openForValidation = hasOpenAction ? asOpenObject(rule[RULE_FIELD_OPEN]) : null;
  if (openForValidation) {
    const openContext = makeRuleContext(ruleId, RULE_SECTION_OPEN);
    pushUnsupportedKeys(
      errors,
      openContext,
      openForValidation,
      OPEN_ALLOWED_KEYS
    );
    pushBooleanEnabledErrorWhenPresent(errors, openContext, openForValidation);
    validateOpenTtlKeys(errors, openContext, openForValidation);
    const openSpells = asSelectorList(asObj(openForValidation)[OPEN_FIELD_SPELLS]);
    if (requireNonEmptyArray(errors, openSpells, `${openContext} requires spells[]`)) {
      const seenOpenSpells = new Set();
      for (const openSpellRaw of openSpells) {
        const openSpellId = normalizeSpellId(openSpellRaw);
        if (!openSpellId) {
          errors.push(`${openContext} contains empty spell id`);
          continue;
        }
        if (seenOpenSpells.has(openSpellId)) {
          errors.push(`${openContext} contains duplicate spell id: ${openSpellRaw}`);
        }
        seenOpenSpells.add(openSpellId);
        if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, openSpellId)) {
          errors.push(`${openContext} ${ERR_REF_UNKNOWN_OR_INACTIVE_SPELL}: ${openSpellRaw}`);
        }
      }
    }
  }
  const triggerEntries = collectRuleTriggerEntries(rule, TRIGGER_SOURCE_KEYS);
  if (hasNonEmptyArray(triggerEntries) || hasOpenAction) {
    const triggerContext = makeRuleContext(ruleId, RULE_SECTION_TRIGGER);
    for (const rawTrigger of triggerEntries) {
      const trigger = asTriggerObject(rawTrigger);
      pushUnsupportedKeys(
        errors,
        triggerContext,
        trigger,
        TRIGGER_ALLOWED_KEYS
      );
      pushBooleanEnabledErrorWhenPresent(errors, triggerContext, trigger);
      const normalizedEventId = normalizeEventId(trigger[TRIGGER_FIELD_EVENT]);
      if (!normalizedEventId) {
        errors.push(`${triggerContext} is missing event`);
      } else if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedEventId)) {
        errors.push(`${triggerContext} references unknown event id: ${trigger[TRIGGER_FIELD_EVENT]}`);
      }
      if (
        typeof rawTrigger !== "string" &&
        Object.hasOwn(trigger, TRIGGER_FIELD_ARGS) &&
        !isPlainObject(trigger[TRIGGER_FIELD_ARGS])
      ) {
        errors.push(`${triggerContext} args must be an object when present`);
      }
    }
  } else {
    errors.push(`${ruleContext} must define ${LABEL_OPEN_OR_TRIGGER_ACTIONS}`);
  }
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  pushUnsupportedKeys(errors, ROOT_CONTEXT, target, ROOT_ALLOWED_KEYS);
  if (asText(target[FIELD_VERSION]) !== ORCHESTRATOR_VERSION) {
    errors.push(`${ROOT_CONTEXT}.version must be "${ORCHESTRATOR_VERSION}"`);
  }
  if (typeof target[FIELD_ENABLED] !== TYPE_BOOLEAN) errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  if (!Array.isArray(target[FIELD_RULES])) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return errors;
  }
  validateOptionalObjectSection(target, FIELD_DEFAULTS, (defaults) => {
    pushUnsupportedKeys(
      errors,
      DEFAULTS_CONTEXT,
      defaults,
      DEFAULTS_ALLOWED_KEYS
    );
    validateOptionalObjectSection(defaults, DEFAULTS_KEY_OPEN, (defaultsOpen) => {
      pushUnsupportedKeys(errors, DEFAULTS_OPEN_CONTEXT, defaultsOpen, OPEN_TTL_KEYS);
      validateOpenTtlKeys(errors, DEFAULTS_OPEN_CONTEXT, defaultsOpen);
    });
    for (const [rawEventId, args] of getMergedDefaultTriggerEntries(defaults)) {
      const normalizedEventId = normalizeEventId(rawEventId);
      if (!normalizedEventId) {
        errors.push(`${DEFAULTS_TRIGGER_CONTEXT} has invalid event key: ${rawEventId}`);
        continue;
      }
      if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedEventId)) {
        errors.push(`${DEFAULTS_TRIGGER_CONTEXT} references unknown event id: ${rawEventId}`);
        continue;
      }
      if (!isPlainObject(args)) {
        errors.push(`${DEFAULTS_TRIGGER_CONTEXT}[${rawEventId}] must be an object`);
      }
    }
    validateOptionalObjectSection(defaults, DEFAULTS_KEY_RULE, (defaultsRule) => {
      pushUnsupportedKeys(
        errors,
        DEFAULTS_RULE_CONTEXT,
        defaultsRule,
        DEFAULTS_RULE_ALLOWED_KEYS
      );
      validateRuleNumericKeys(errors, DEFAULTS_RULE_CONTEXT, defaultsRule);
    });
  });
  const ids = new Set();
  for (const rawRule of target[FIELD_RULES]) {
    validateRuleEntry(errors, ids, rawRule);
  }
  return errors;
}
