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
const RULES_CONTEXT = `${ROOT_CONTEXT}.rules`;
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_OPEN_CONTEXT = `${DEFAULTS_CONTEXT}.open`;
const DEFAULTS_RULE_CONTEXT = `${DEFAULTS_CONTEXT}.rule`;
const DEFAULTS_TRIGGER_CONTEXT = `${DEFAULTS_CONTEXT}.trigger`;

function formatContextKey(context, key) {
  return context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`;
}

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
  const n = Number(source[key]);
  if (!isValid(n)) {
    const contextKey = formatContextKey(context, key);
    errors.push(`${contextKey} ${errorMessage}`);
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

function validateKnownEventId(errors, rawEventId, invalidMessage, unknownMessage) {
  const eventId = normalizeEventId(rawEventId);
  if (!eventId) {
    errors.push(invalidMessage);
    return null;
  }
  if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) errors.push(unknownMessage);
  return eventId;
}

const SIGNAL_DEFINITIONS_SOURCE = (
  typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID
)
  ? SIGNAL_DEFINITIONS_BY_ID
  : {};
function collectKnownSignalIds(prefix) {
  return new Set(
    Object.keys(SIGNAL_DEFINITIONS_SOURCE)
      .filter((signalId) => typeof signalId === "string" && signalId.startsWith(prefix))
      .map((signalId) => signalId.slice(prefix.length))
      .filter(Boolean)
  );
}

const KNOWN_GESTURE_IDS = collectKnownSignalIds("gesture.");
const KNOWN_ORB_STATE_IDS = collectKnownSignalIds("orb_state.");
const ON_SELECTOR_CATALOG = Object.freeze({
  spell: Object.freeze({
    unknownReason: "inactive or unknown spell id",
    isKnown: (id) => Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id),
  }),
  gesture: Object.freeze({
    unknownReason: "unknown gesture id",
    isKnown: (id) => KNOWN_GESTURE_IDS.has(id),
  }),
  orb_state: Object.freeze({
    unknownReason: "unknown orb_state id",
    isKnown: (id) => KNOWN_ORB_STATE_IDS.has(id),
  }),
});

const ROOT_ALLOWED_KEYS = Object.freeze(new Set(["version", "enabled", "defaults", "rules"]));
const DEFAULTS_ALLOWED_KEYS = Object.freeze(new Set(["open", ...TRIGGER_SOURCE_KEYS, "rule"]));
const DEFAULTS_RULE_ALLOWED_KEYS = Object.freeze(new Set([
  ...RULE_COOLDOWN_KEYS,
  ...RULE_MATCH_WINDOW_KEYS,
  ...RULE_PRIORITY_KEYS,
]));
const RULE_ALLOWED_KEYS = Object.freeze(new Set([
  "id",
  "on",
  "open",
  ...TRIGGER_SOURCE_KEYS,
  "enabled",
  ...RULE_PRIORITY_KEYS,
  ...RULE_COOLDOWN_KEYS,
  ...RULE_MATCH_WINDOW_KEYS,
]));
const OPEN_ALLOWED_KEYS = Object.freeze(new Set(["spells", ...OPEN_TTL_KEYS, "enabled"]));
const TRIGGER_ALLOWED_KEYS = Object.freeze(new Set(["event", "enabled", "args"]));
const SUPPORTED_ON_SELECTOR_TYPES = Object.freeze(new Set(Object.keys(ON_SELECTOR_CATALOG)));
const RULE_ID_REQUIRED_ERROR = `${RULES_CONTEXT}[] entry is missing id`;

function formatRuleSelectorError(ruleContext, reason, value = "") {
  return value
    ? `${ruleContext} ${reason}: ${value}`
    : `${ruleContext} ${reason}`;
}

function validateOpenSpells(errors, ruleId, open) {
  const openContext = makeRuleContext(ruleId, "open");
  const openSpells = asSelectorList(asObj(open).spells);
  if (!requireNonEmptyArray(errors, openSpells, `${openContext} requires spells[]`)) return;
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
      errors.push(`${openContext} references inactive or unknown spell id: ${openSpellRaw}`);
    }
  }
}

function validateTriggerEntries(errors, ruleId, triggerEntries) {
  const triggerContext = makeRuleContext(ruleId, "trigger");
  for (const rawTrigger of triggerEntries) {
    const isTriggerString = typeof rawTrigger === "string";
    const trigger = asTriggerObject(rawTrigger);
    pushUnsupportedKeys(errors, triggerContext, trigger, TRIGGER_ALLOWED_KEYS);
    pushBooleanEnabledErrorWhenPresent(errors, triggerContext, trigger);
    const unknownEventError = `${triggerContext} references unknown event id: ${trigger.event}`;
    validateKnownEventId(
      errors,
      trigger.event,
      `${triggerContext} is missing event`,
      unknownEventError
    );
    if (
      !isTriggerString &&
      Object.hasOwn(trigger, "args") &&
      !isPlainObject(trigger.args)
    ) {
      errors.push(`${triggerContext} args must be an object when present`);
    }
  }
}

function validateOnSelectors(errors, ruleId, onEntries) {
  const ruleContext = makeRuleContext(ruleId);
  const seenOn = new Set();
  if (!requireNonEmptyArray(errors, onEntries, `${ruleContext} must define on selectors`)) return;
  for (const entry of onEntries) {
    const type = asText(entry?.type).toLowerCase();
    const id = asText(entry?.id).toLowerCase();
    const rawId = entry.raw || id;
    if (!SUPPORTED_ON_SELECTOR_TYPES.has(type)) {
      errors.push(formatRuleSelectorError(ruleContext, "has unsupported on selector type"));
      continue;
    }
    const selectorConfig = ON_SELECTOR_CATALOG[type];
    if (!id) {
      errors.push(formatRuleSelectorError(ruleContext, `has empty on.${type}`));
      continue;
    }
    const selectorKey = `${type}.${id}`;
    if (seenOn.has(selectorKey)) {
      errors.push(formatRuleSelectorError(ruleContext, "contains duplicate on selector", `${type}.${id}`));
      continue;
    }
    seenOn.add(selectorKey);
    if (!selectorConfig.isKnown(id)) {
      errors.push(formatRuleSelectorError(ruleContext, `references ${selectorConfig.unknownReason}`, rawId));
    }
  }
}

function validateRuleOpenAction(errors, ruleId, openForValidation) {
  if (!openForValidation) return;
  const openContext = makeRuleContext(ruleId, "open");
  pushUnsupportedKeys(errors, openContext, openForValidation, OPEN_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, openContext, openForValidation);
  validateOpenTtlKeys(errors, openContext, openForValidation);
  validateOpenSpells(errors, ruleId, openForValidation);
}

function collectRuleOnEntries(errors, rule, ruleId) {
  const ruleOnContext = makeRuleContext(ruleId, "on");
  if (isStringOrArray(rule.on)) {
    return parseOnSelectorList(rule.on, { invalidAsEmptyObject: true });
  }
  const on = asObj(rule.on);
  pushUnsupportedKeys(errors, ruleOnContext, on, ON_SELECTOR_ALLOWED_KEYS);
  return collectOnEntriesFromObjectSelectors(on, { includeRaw: true });
}

function validateRuleActionPresence(errors, ruleId, ruleContext, hasOpenAction, triggerEntries) {
  const hasTriggerActions = hasNonEmptyArray(triggerEntries);
  const ruleActionsRequiredError = `${ruleContext} must define open and/or trigger actions`;
  if (hasTriggerActions || hasOpenAction) {
    validateTriggerEntries(errors, ruleId, triggerEntries);
  } else {
    errors.push(ruleActionsRequiredError);
  }
}

function validateRuleIdentity(errors, seenRuleIds, rule) {
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push(RULE_ID_REQUIRED_ERROR);
    return "";
  }
  if (seenRuleIds.has(ruleId)) errors.push(`${RULES_CONTEXT} contains duplicate id: ${ruleId}`);
  seenRuleIds.add(ruleId);
  return ruleId;
}

function validateRuleEntry(errors, seenRuleIds, rawRule) {
  const rule = asObj(rawRule);
  const ruleId = validateRuleIdentity(errors, seenRuleIds, rule);
  if (!ruleId) return;

  const ruleContext = makeRuleContext(ruleId);
  pushUnsupportedKeys(errors, ruleContext, rule, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, rule);
  validateRuleNumericKeys(errors, ruleContext, rule);
  const onEntries = collectRuleOnEntries(errors, rule, ruleId);
  validateOnSelectors(errors, ruleId, onEntries);
  const hasOpenAction = Object.hasOwn(rule, "open");
  const openForValidation = hasOpenAction ? asOpenObject(rule.open) : null;
  validateRuleOpenAction(errors, ruleId, openForValidation);
  const triggerEntries = collectRuleTriggerEntries(rule, TRIGGER_SOURCE_KEYS);
  validateRuleActionPresence(errors, ruleId, ruleContext, hasOpenAction, triggerEntries);
}

function validateDefaultTriggerEntries(errors, defaults) {
  const defaultTriggerEntries = getMergedDefaultTriggerEntries(defaults);
  for (const [rawEventId, args] of defaultTriggerEntries) {
    if (!validateKnownEventId(
      errors,
      rawEventId,
      `${DEFAULTS_TRIGGER_CONTEXT} has invalid event key: ${rawEventId}`,
      `${DEFAULTS_TRIGGER_CONTEXT} references unknown event id: ${rawEventId}`
    )) {
      continue;
    }
    if (!isPlainObject(args)) {
      errors.push(`${DEFAULTS_TRIGGER_CONTEXT}[${rawEventId}] must be an object`);
    }
  }
}

function validateOrchestratorRoot(errors, target) {
  pushUnsupportedKeys(errors, ROOT_CONTEXT, target, ROOT_ALLOWED_KEYS);
  if (asText(target.version) !== "1") errors.push(`${ROOT_CONTEXT}.version must be "1"`);
  if (typeof target.enabled !== "boolean") errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  if (!Array.isArray(target.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return false;
  }
  return true;
}

function validateOrchestratorDefaults(errors, target) {
  validateOptionalObjectSection(target, "defaults", (defaults) => {
    pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, DEFAULTS_ALLOWED_KEYS);
    validateOptionalObjectSection(defaults, "open", (defaultsOpen) => {
      pushUnsupportedKeys(errors, DEFAULTS_OPEN_CONTEXT, defaultsOpen, OPEN_TTL_KEYS);
      validateOpenTtlKeys(errors, DEFAULTS_OPEN_CONTEXT, defaultsOpen);
    });
    validateDefaultTriggerEntries(errors, defaults);
    validateOptionalObjectSection(defaults, "rule", (defaultsRule) => {
      pushUnsupportedKeys(
        errors,
        DEFAULTS_RULE_CONTEXT,
        defaultsRule,
        DEFAULTS_RULE_ALLOWED_KEYS
      );
      validateRuleNumericKeys(errors, DEFAULTS_RULE_CONTEXT, defaultsRule);
    });
  });
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  if (!validateOrchestratorRoot(errors, target)) {
    return errors;
  }
  validateOrchestratorDefaults(errors, target);
  const ids = new Set();
  for (const rawRule of target.rules) {
    validateRuleEntry(errors, ids, rawRule);
  }
  return errors;
}
