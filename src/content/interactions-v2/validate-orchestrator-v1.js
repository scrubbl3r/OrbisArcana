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
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_OPEN_CONTEXT = `${DEFAULTS_CONTEXT}.open`;
const DEFAULTS_TRIGGER_CONTEXT = `${DEFAULTS_CONTEXT}.trigger`;
const DEFAULTS_RULE_CONTEXT = `${DEFAULTS_CONTEXT}.rule`;
const SIGNAL_PREFIX_GESTURE = "gesture.";
const SIGNAL_PREFIX_ORB_STATE = "orb_state.";
const SUPPORTED_ON_SELECTOR_TYPES = Object.freeze([
  "spell",
  "gesture",
  "orb_state",
]);
const ROOT_ALLOWED_KEYS = new Set(["version", "enabled", "defaults", "rules"]);
const RULE_ALLOWED_KEYS = new Set([
  "id",
  "on",
  "open",
  ...TRIGGER_SOURCE_KEYS,
  "enabled",
  ...RULE_PRIORITY_KEYS,
  ...RULE_COOLDOWN_KEYS,
  ...RULE_MATCH_WINDOW_KEYS,
]);
const OPEN_ALLOWED_KEYS = new Set(["spells", ...OPEN_TTL_KEYS, "enabled"]);
const TRIGGER_ALLOWED_KEYS = new Set(["event", "enabled", "args"]);
const DEFAULTS_ALLOWED_KEYS = new Set(["open", ...TRIGGER_SOURCE_KEYS, "rule"]);
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
  if (!Object.hasOwn(obj, key)) return;
  if (!isValid(Number(obj[key]))) {
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

const knownGestureIds = new Set(
  Object.keys((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
    ? SIGNAL_DEFINITIONS_BY_ID
    : {})
    .filter((signalId) => typeof signalId === "string" && signalId.startsWith(SIGNAL_PREFIX_GESTURE))
    .map((signalId) => signalId.slice(SIGNAL_PREFIX_GESTURE.length))
    .filter(Boolean)
);

function pushDuplicateWhenSeen(errors, seenValues, value, message) {
  if (seenValues.has(value)) {
    errors.push(message);
    return true;
  }
  seenValues.add(value);
  return false;
}
const knownOrbStateIds = new Set(
  Object.keys((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
    ? SIGNAL_DEFINITIONS_BY_ID
    : {})
    .filter((signalId) => typeof signalId === "string" && signalId.startsWith(SIGNAL_PREFIX_ORB_STATE))
    .map((signalId) => signalId.slice(SIGNAL_PREFIX_ORB_STATE.length))
    .filter(Boolean)
);

function validateRuleEntry(errors, seenRuleIds, rawRule) {
  const rule = asObj(rawRule);
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return;
  }
  pushDuplicateWhenSeen(
    errors,
    seenRuleIds,
    ruleId,
    `${ROOT_CONTEXT}.rules contains duplicate id: ${ruleId}`
  );

  const ruleContext = makeRuleContext(ruleId);
  pushUnsupportedKeys(errors, ruleContext, rule, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, rule);
  validateRuleNumericKeys(errors, ruleContext, rule);
  const onContext = makeRuleContext(ruleId, "on");
  let onEntries = [];
  if (isStringOrArray(rule.on)) {
    onEntries = parseOnSelectorList(rule.on, { invalidAsEmptyObject: true });
  } else {
    const on = asObj(rule.on);
    pushUnsupportedKeys(errors, onContext, on, ON_SELECTOR_ALLOWED_KEYS);
    onEntries = collectOnEntriesFromObjectSelectors(on, { includeRaw: true });
  }
  if (!requireNonEmptyArray(errors, onEntries, `${ruleContext} must define on selectors`)) {
    return;
  }
  const seenOn = new Set();
  for (const entry of onEntries) {
    const type = asText(entry?.type).toLowerCase();
    const id = asText(entry?.id).toLowerCase();
    const rawId = entry.raw || id;
    if (!SUPPORTED_ON_SELECTOR_TYPES.includes(type)) {
      errors.push(`${ruleContext} has unsupported on selector type`);
      continue;
    }
    if (!id) {
      errors.push(`${ruleContext} has empty on.${type}`);
      continue;
    }
    const selectorKey = `${type}.${id}`;
    if (pushDuplicateWhenSeen(
      errors,
      seenOn,
      selectorKey,
      `${ruleContext} contains duplicate on selector: ${selectorKey}`
    )) {
      continue;
    }
    if (type === "spell" && !Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id)) {
      errors.push(`${ruleContext} references inactive or unknown spell id: ${rawId}`);
    } else if (type === "gesture" && !knownGestureIds.has(id)) {
      errors.push(`${ruleContext} references unknown gesture id: ${rawId}`);
    } else if (type === "orb_state" && !knownOrbStateIds.has(id)) {
      errors.push(`${ruleContext} references unknown orb_state id: ${rawId}`);
    }
  }
  const hasOpen = Object.hasOwn(rule, "open");
  const openForValidation = hasOpen ? asOpenObject(rule.open) : null;
  if (openForValidation) {
    const openContext = makeRuleContext(ruleId, "open");
    pushUnsupportedKeys(
      errors,
      openContext,
      openForValidation,
      OPEN_ALLOWED_KEYS
    );
    pushBooleanEnabledErrorWhenPresent(errors, openContext, openForValidation);
    validateOpenTtlKeys(errors, openContext, openForValidation);
    const openSpells = asSelectorList(openForValidation.spells);
    if (requireNonEmptyArray(errors, openSpells, `${openContext} requires spells[]`)) {
      const seenOpenSpells = new Set();
      for (const openSpellRaw of openSpells) {
        const openSpellId = normalizeSpellId(openSpellRaw);
        if (!openSpellId) {
          errors.push(`${openContext} contains empty spell id`);
          continue;
        }
        pushDuplicateWhenSeen(
          errors,
          seenOpenSpells,
          openSpellId,
          `${openContext} contains duplicate spell id: ${openSpellRaw}`
        );
        if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, openSpellId)) {
          errors.push(`${openContext} references inactive or unknown spell id: ${openSpellRaw}`);
        }
      }
    }
  }
  const triggerEntries = collectRuleTriggerEntries(rule, TRIGGER_SOURCE_KEYS);
  if (hasOpen || hasNonEmptyArray(triggerEntries)) {
    const triggerContext = makeRuleContext(ruleId, "trigger");
    for (const rawTrigger of triggerEntries) {
      const trigger = asTriggerObject(rawTrigger);
      pushUnsupportedKeys(
        errors,
        triggerContext,
        trigger,
        TRIGGER_ALLOWED_KEYS
      );
      pushBooleanEnabledErrorWhenPresent(errors, triggerContext, trigger);
      const normalizedEventId = normalizeEventId(trigger.event);
      if (!normalizedEventId) {
        errors.push(`${triggerContext} is missing event`);
      } else if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedEventId)) {
        errors.push(`${triggerContext} references unknown event id: ${trigger.event}`);
      }
      if (
        typeof rawTrigger !== "string" &&
        Object.hasOwn(trigger, "args") &&
        !isPlainObject(trigger.args)
      ) {
        errors.push(`${triggerContext} args must be an object when present`);
      }
    }
    return;
  }
  errors.push(`${ruleContext} must define open and/or trigger actions`);
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  pushUnsupportedKeys(errors, ROOT_CONTEXT, target, ROOT_ALLOWED_KEYS);
  if (asText(target.version) !== "1") {
    errors.push(`${ROOT_CONTEXT}.version must be "1"`);
  }
  if (typeof target.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(target.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return errors;
  }
  validateOptionalObjectSection(target, "defaults", (defaults) => {
    pushUnsupportedKeys(
      errors,
      DEFAULTS_CONTEXT,
      defaults,
      DEFAULTS_ALLOWED_KEYS
    );
    validateOptionalObjectSection(defaults, "open", (defaultsOpen) => {
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
  const ids = new Set();
  for (const rawRule of target.rules) {
    validateRuleEntry(errors, ids, rawRule);
  }
  return errors;
}
