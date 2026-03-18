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
  collectOnEntriesFromObjectSelectors,
  collectRuleTriggerEntries,
  getMergedDefaultTriggerEntries,
  pushUnsupportedKeys,
} from "./orchestrator-v1-normalizers.js";

const ROOT_CONTEXT = "ORCHESTRATOR_V1";
const RULES_CONTEXT = `${ROOT_CONTEXT}.rules`;
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_OPEN_CONTEXT = `${DEFAULTS_CONTEXT}.open`;
const DEFAULTS_TRIGGER_CONTEXT = `${DEFAULTS_CONTEXT}.trigger`;
const DEFAULTS_RULE_CONTEXT = `${DEFAULTS_CONTEXT}.rule`;

function formatContextKey(context, key) {
  return context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`;
}

function getOwnNumberInfo(obj, key) {
  const source = asObj(obj);
  if (!Object.hasOwn(source, key)) return { present: false, n: null };
  return { present: true, n: Number(source[key]) };
}

function pushFiniteAtLeastErrorWhenPresent(errors, context, obj, key, min) {
  const { present, n } = getOwnNumberInfo(obj, key);
  if (!present) return;
  if (!Number.isFinite(n) || n < min) {
    errors.push(
      `${formatContextKey(context, key)} must be a finite number >= ${min} when present`
    );
  }
}

function pushFiniteNonNegativeErrorWhenPresent(errors, context, obj, key) {
  const { present, n } = getOwnNumberInfo(obj, key);
  if (!present) return;
  if (!Number.isFinite(n) || n < 0) {
    errors.push(
      `${formatContextKey(context, key)} must be a finite number >= 0 when present`
    );
  }
}

function pushBooleanEnabledErrorWhenPresent(errors, context, obj) {
  const source = asObj(obj);
  if (Object.hasOwn(source, "enabled") && typeof source.enabled !== "boolean") {
    errors.push(`${context} enabled must be boolean when present`);
  }
}

function pushFiniteNumberErrorWhenPresent(errors, context, obj, key) {
  const { present, n } = getOwnNumberInfo(obj, key);
  if (!present) return;
  if (!Number.isFinite(n)) {
    errors.push(
      `${formatContextKey(context, key)} must be a finite number when present`
    );
  }
}

function pushErrorsForKeys(errors, context, obj, keys, pushErrorFn) {
  for (const key of keys) pushErrorFn(errors, context, obj, key);
}

function validateRulePriorityConstraints(errors, context, target) {
  pushFiniteNumberErrorWhenPresent(errors, context, target, RULE_PRIORITY_KEY);
}

function validateRuleCooldownConstraints(errors, context, target) {
  pushErrorsForKeys(
    errors,
    context,
    target,
    RULE_COOLDOWN_KEYS,
    pushFiniteNonNegativeErrorWhenPresent
  );
}

function validateRuleMatchWindowConstraints(errors, context, target) {
  pushErrorsForKeys(
    errors,
    context,
    target,
    RULE_MATCH_WINDOW_KEYS,
    (errs, ctx, obj, key) =>
      pushFiniteAtLeastErrorWhenPresent(
        errs,
        ctx,
        obj,
        key,
        ORCHESTRATOR_MIN_MATCH_WINDOW_MS
      )
  );
}

function validateOpenTtlConstraints(errors, context, target) {
  pushErrorsForKeys(
    errors,
    context,
    target,
    OPEN_TTL_KEYS,
    pushFiniteNonNegativeErrorWhenPresent
  );
}

function makeRuleContext(ruleId, section = "") {
  return section ? `rule ${ruleId} ${section}` : `rule ${ruleId}`;
}

function makeSelectorKey(type, id) {
  return `${type}:${id}`;
}

function toTriggerValidationInput(rawTrigger) {
  const isString = typeof rawTrigger === "string";
  return {
    isString,
    trigger: asTriggerObject(rawTrigger),
  };
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

function isActiveSpellId(id) {
  return Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id);
}

const SIGNAL_DEFINITIONS_SOURCE = (
  typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID
)
  ? SIGNAL_DEFINITIONS_BY_ID
  : {};

function collectKnownSignalIdsByPrefix(prefix) {
  return new Set(
    Object.keys(SIGNAL_DEFINITIONS_SOURCE)
      .filter((signalId) => typeof signalId === "string" && signalId.startsWith(`${prefix}.`))
      .map((signalId) => signalId.slice(prefix.length + 1))
      .filter(Boolean)
  );
}

const KNOWN_GESTURE_IDS = collectKnownSignalIdsByPrefix("gesture");
const KNOWN_ORB_STATE_IDS = collectKnownSignalIdsByPrefix("orb_state");
const ON_SELECTOR_CATALOG = Object.freeze({
  spell: Object.freeze({
    unknownReason: "inactive or unknown spell id",
    isKnown: (id) => isActiveSpellId(id),
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
    if (!isActiveSpellId(openSpellId)) {
      errors.push(`${openContext} references inactive or unknown spell id: ${openSpellRaw}`);
    }
  }
}

function validateTriggerEntryCore(errors, triggerContext, trigger) {
  pushUnsupportedKeys(errors, triggerContext, trigger, TRIGGER_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, triggerContext, trigger);
  validateTriggerEntryEvent(errors, triggerContext, trigger);
}

function validateTriggerEntryEvent(errors, triggerContext, trigger) {
  validateKnownEventId(
    errors,
    trigger.event,
    `${triggerContext} is missing event`,
    `${triggerContext} references unknown event id: ${trigger.event}`
  );
}

function validateTriggerEntryArgs(errors, triggerContext, isTriggerString, trigger) {
  if (
    !isTriggerString &&
    Object.hasOwn(trigger, "args") &&
    !isPlainObject(trigger.args)
  ) {
    errors.push(`${triggerContext} args must be an object when present`);
  }
}

function validateTriggerEntries(errors, ruleId, triggerEntries) {
  const triggerContext = makeRuleContext(ruleId, "trigger");
  for (const rawTrigger of triggerEntries) {
    const { isString: isTriggerString, trigger } = toTriggerValidationInput(rawTrigger);
    validateTriggerEntryCore(errors, triggerContext, trigger);
    validateTriggerEntryArgs(errors, triggerContext, isTriggerString, trigger);
  }
}

function validateOnSelectorCore(errors, ruleContext, entry) {
  const type = asText(entry?.type).toLowerCase();
  const id = asText(entry?.id).toLowerCase();
  const rawId = entry.raw || id;
  const selectorConfig = ON_SELECTOR_CATALOG[type];
  if (!selectorConfig) {
    errors.push(`${ruleContext} has unsupported on selector type`);
    return { type, id, rawId, selectorConfig: null };
  }
  if (!id) {
    errors.push(`${ruleContext} has empty on.${type}`);
    return { type, id, rawId, selectorConfig };
  }
  return { type, id, rawId, selectorConfig };
}

function validateOnSelectors(errors, ruleId, onEntries) {
  const ruleContext = makeRuleContext(ruleId);
  const seenOn = new Set();
  if (!requireNonEmptyArray(errors, onEntries, `${ruleContext} must define on selectors`)) return;
  for (const entry of onEntries) {
    const { type, id, rawId, selectorConfig } = validateOnSelectorCore(errors, ruleContext, entry);
    if (!selectorConfig || !id) continue;
    const selectorKey = makeSelectorKey(type, id);
    if (seenOn.has(selectorKey)) {
      errors.push(`${ruleContext} contains duplicate on selector: ${type}.${id}`);
      continue;
    }
    seenOn.add(selectorKey);
    if (!selectorConfig.isKnown(id)) {
      errors.push(`${ruleContext} references ${selectorConfig.unknownReason}: ${rawId}`);
    }
  }
}

function collectOnEntriesFromRule(rule, ruleId, errors) {
  if (isStringOrArray(rule.on)) {
    return parseOnSelectorList(rule.on, { invalidAsEmptyObject: true });
  }
  const on = asObj(rule.on);
  const onContext = makeRuleContext(ruleId, "on");
  pushUnsupportedKeys(errors, onContext, on, ON_SELECTOR_ALLOWED_KEYS);
  return collectOnEntriesFromObjectSelectors(on, { includeRaw: true });
}

function registerRuleId(errors, seenRuleIds, rawRule) {
  const rule = asObj(rawRule);
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push(`${RULES_CONTEXT}[] entry is missing id`);
    return null;
  }
  if (seenRuleIds.has(ruleId)) errors.push(`${RULES_CONTEXT} contains duplicate id: ${ruleId}`);
  seenRuleIds.add(ruleId);
  return { rule, ruleId };
}

function resolveOpenForValidation(errors, ruleId, rule) {
  if (!Object.hasOwn(rule, "open")) return null;
  const open = asOpenObject(rule.open);
  const openContext = makeRuleContext(ruleId, "open");
  pushUnsupportedKeys(errors, openContext, open, OPEN_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, openContext, open);
  validateOpenTtlConstraints(errors, openContext, open);
  return open;
}

function validateRuleNumericConstraints(errors, context, target) {
  validateRulePriorityConstraints(errors, context, target);
  validateRuleCooldownConstraints(errors, context, target);
  validateRuleMatchWindowConstraints(errors, context, target);
}

function validateRuleActionsPresence(errors, context, openForValidation, triggerEntries) {
  if (hasNonEmptyArray(triggerEntries)) return true;
  if (openForValidation) return true;
  errors.push(`${context} must define open and/or trigger actions`);
  return false;
}

function validateRuleOpenSection(errors, ruleId, rule) {
  const openForValidation = resolveOpenForValidation(errors, ruleId, rule);
  if (openForValidation) {
    validateOpenSpells(errors, ruleId, openForValidation);
  }
  return openForValidation;
}

function validateRuleTriggerSection(errors, ruleId, context, rule, openForValidation) {
  const triggerEntries = collectRuleTriggerEntries(rule, TRIGGER_SOURCE_KEYS);
  if (!validateRuleActionsPresence(errors, context, openForValidation, triggerEntries)) return;
  validateTriggerEntries(errors, ruleId, triggerEntries);
}

function validateRuleCore(errors, context, rule) {
  pushUnsupportedKeys(errors, context, rule, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, context, rule);
  validateRuleNumericConstraints(errors, context, rule);
}

function validateRuleOnSection(errors, ruleId, rule) {
  const onEntries = collectOnEntriesFromRule(rule, ruleId, errors);
  validateOnSelectors(errors, ruleId, onEntries);
}

function validateDefaultsObjectSection(errors, defaults, key, validateSectionFn) {
  if (!Object.hasOwn(defaults, key)) return;
  validateSectionFn(errors, asObj(defaults[key]));
}

function validateDefaultsOpenCore(errors, defaultsOpen) {
  pushUnsupportedKeys(errors, DEFAULTS_OPEN_CONTEXT, defaultsOpen, OPEN_TTL_KEYS);
  validateOpenTtlConstraints(errors, DEFAULTS_OPEN_CONTEXT, defaultsOpen);
}

function validateDefaultsOpen(errors, defaults) {
  validateDefaultsObjectSection(errors, defaults, "open", validateDefaultsOpenCore);
}

function validateDefaultsTriggerEntry(errors, rawEventId, args) {
  if (!validateKnownEventId(
    errors,
    rawEventId,
    `${DEFAULTS_TRIGGER_CONTEXT} has invalid event key: ${rawEventId}`,
    `${DEFAULTS_TRIGGER_CONTEXT} references unknown event id: ${rawEventId}`
  )) return;
  if (!isPlainObject(args)) {
    errors.push(`${DEFAULTS_TRIGGER_CONTEXT}[${rawEventId}] must be an object`);
  }
}

function validateDefaultsTriggers(errors, defaults) {
  const defaultTriggerEntries = getMergedDefaultTriggerEntries(defaults);
  if (!defaultTriggerEntries.length) return;
  for (const [rawEventId, args] of defaultTriggerEntries) {
    validateDefaultsTriggerEntry(errors, rawEventId, args);
  }
}

function validateDefaultsRule(errors, defaults) {
  validateDefaultsObjectSection(errors, defaults, "rule", (errs, defaultsRule) => {
    pushUnsupportedKeys(errs, DEFAULTS_RULE_CONTEXT, defaultsRule, DEFAULTS_RULE_ALLOWED_KEYS);
    validateRuleNumericConstraints(errs, DEFAULTS_RULE_CONTEXT, defaultsRule);
  });
}

function validateDefaultsCore(errors, defaults) {
  pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, DEFAULTS_ALLOWED_KEYS);
  validateDefaultsOpen(errors, defaults);
  validateDefaultsTriggers(errors, defaults);
  validateDefaultsRule(errors, defaults);
}

function validateDefaultsSection(errors, target) {
  validateDefaultsObjectSection(errors, target, "defaults", validateDefaultsCore);
}

function validateRuleEntry(errors, seenRuleIds, rawRule) {
  const resolved = registerRuleId(errors, seenRuleIds, rawRule);
  if (!resolved) return;
  const { rule, ruleId } = resolved;

  const context = makeRuleContext(ruleId);
  validateRuleCore(errors, context, rule);
  validateRuleOnSection(errors, ruleId, rule);
  const openForValidation = validateRuleOpenSection(errors, ruleId, rule);
  validateRuleTriggerSection(errors, ruleId, context, rule, openForValidation);
}

function validateRootShape(errors, target) {
  pushUnsupportedKeys(errors, ROOT_CONTEXT, target, ROOT_ALLOWED_KEYS);
  if (asText(target.version) !== "1") errors.push(`${ROOT_CONTEXT}.version must be "1"`);
  if (typeof target.enabled !== "boolean") errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  if (!Array.isArray(target.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return false;
  }
  return true;
}

function validateRulesSection(errors, target) {
  const ids = new Set();
  for (const rawRule of target.rules) {
    validateRuleEntry(errors, ids, rawRule);
  }
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  if (!validateRootShape(errors, target)) return errors;
  validateDefaultsSection(errors, target);
  validateRulesSection(errors, target);
  return errors;
}
