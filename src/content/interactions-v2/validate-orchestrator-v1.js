import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asObj,
  asText,
  normalizeSpellId,
  normalizeEventId,
  normalizeGestureId,
  normalizeOrbStateId,
  parseOnSelector,
  asSelectorList,
  normalizeTriggerEntries,
} from "./orchestrator-v1-normalizers.js";

function isFiniteNonNegative(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

function isFiniteAtLeast(v, min) {
  const n = Number(v);
  return Number.isFinite(n) && n >= min;
}

function isFiniteNumber(v) {
  return Number.isFinite(Number(v));
}

function isSelectorListLike(v) {
  return typeof v === "string" || Array.isArray(v);
}

function isObjectRecord(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

const MIN_NONNEGATIVE = 0;
const MIN_MATCH_WINDOW_MS = 100;

function pushUnsupportedKeys(errors, context, obj, allowedKeys) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(asObj(obj))) {
    if (!allowed.has(key)) errors.push(`${context} contains unsupported key: ${key}`);
  }
}

function formatContextKeyPath(context, key) {
  return context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`;
}

function pushFiniteAtLeastErrorWhenPresent(errors, context, obj, key, min) {
  const source = asObj(obj);
  if (!hasOwn(source, key)) return;
  if (!isFiniteAtLeast(source[key], min)) {
    errors.push(`${formatContextKeyPath(context, key)} must be a finite number >= ${min} when present`);
  }
}

function pushFiniteNonNegativeErrorWhenPresent(errors, context, obj, key) {
  const source = asObj(obj);
  if (!hasOwn(source, key)) return;
  if (!isFiniteNonNegative(source[key])) {
    errors.push(`${formatContextKeyPath(context, key)} must be a finite number >= ${MIN_NONNEGATIVE} when present`);
  }
}

function pushBooleanEnabledErrorWhenPresent(errors, context, obj) {
  const source = asObj(obj);
  if (hasOwn(source, "enabled") && typeof source.enabled !== "boolean") {
    errors.push(`${context} enabled must be boolean when present`);
  }
}

function pushFiniteNumberErrorWhenPresent(errors, context, obj, key) {
  const source = asObj(obj);
  if (hasOwn(source, key) && !isFiniteNumber(source[key])) {
    errors.push(`${formatContextKeyPath(context, key)} must be a finite number when present`);
  }
}

function getSignalIdsByPrefix(prefix) {
  const source = (typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
    ? SIGNAL_DEFINITIONS_BY_ID
    : {};
  return Object.keys(source)
    .filter((signalId) => typeof signalId === "string" && signalId.startsWith(prefix))
    .map((signalId) => signalId.slice(prefix.length))
    .filter(Boolean);
}

const KNOWN_GESTURE_IDS = new Set(
  getSignalIdsByPrefix("gesture.")
);

const KNOWN_ORB_STATE_IDS = new Set(
  getSignalIdsByPrefix("orb_state.")
);
const ON_SELECTOR_TYPES = Object.freeze(new Set(["spell", "gesture", "orb_state"]));
const ON_SELECTOR_ERROR_LABELS = Object.freeze({
  spell: "inactive or unknown spell id",
  gesture: "unknown gesture id",
  orb_state: "unknown orb_state id",
});
const ON_SELECTOR_ID_CHECKERS = Object.freeze({
  spell: (id) => hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id),
  gesture: (id) => KNOWN_GESTURE_IDS.has(id),
  orb_state: (id) => KNOWN_ORB_STATE_IDS.has(id),
});

const ROOT_ALLOWED_KEYS = Object.freeze(["version", "enabled", "defaults", "rules"]);
const DEFAULTS_ALLOWED_KEYS = Object.freeze(["open", "trigger", "triggers", "rule"]);
const DEFAULTS_OPEN_ALLOWED_KEYS = Object.freeze(["ttlMs", "ttl"]);
const DEFAULTS_RULE_ALLOWED_KEYS = Object.freeze([
  "cooldownMs",
  "cooldown",
  "matchWindowMs",
  "matchWindow",
  "priority",
]);
const RULE_ALLOWED_KEYS = Object.freeze([
  "id",
  "on",
  "open",
  "trigger",
  "triggers",
  "enabled",
  "priority",
  "cooldownMs",
  "cooldown",
  "matchWindowMs",
  "matchWindow",
]);
const OPEN_ALLOWED_KEYS = Object.freeze(["spells", "ttlMs", "ttl", "enabled"]);
const TRIGGER_ALLOWED_KEYS = Object.freeze(["event", "enabled", "args"]);

const ON_SELECTOR_SOURCES = Object.freeze([
  Object.freeze({ key: "spell", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "spells", type: "spell", normalize: normalizeSpellId }),
  Object.freeze({ key: "gesture", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "gestures", type: "gesture", normalize: normalizeGestureId }),
  Object.freeze({ key: "orb_state", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbState", type: "orb_state", normalize: normalizeOrbStateId }),
  Object.freeze({ key: "orbStates", type: "orb_state", normalize: normalizeOrbStateId }),
]);

const ON_SELECTOR_ALLOWED_KEYS = Object.freeze(ON_SELECTOR_SOURCES.map((source) => source.key));

function pushOnEntries(onEntries, raw, type, normalizeId) {
  for (const value of asSelectorList(raw)) {
    onEntries.push(Object.freeze({ type, id: normalizeId(value), raw: value }));
  }
}

function pushParsedOnSelectorEntries(onEntries, raw) {
  for (const entry of asSelectorList(raw)) {
    onEntries.push(parseOnSelector(entry, { invalidAsEmptyObject: true }));
  }
}

function collectOnEntries(rawOn, errors, ruleId) {
  const onEntries = [];
  if (isSelectorListLike(rawOn)) {
    pushParsedOnSelectorEntries(onEntries, rawOn);
    return onEntries;
  }

  const on = asObj(rawOn);
  pushUnsupportedKeys(errors, `rule ${ruleId} on`, on, ON_SELECTOR_ALLOWED_KEYS);
  for (const source of ON_SELECTOR_SOURCES) {
    if (!hasOwn(on, source.key)) continue;
    pushOnEntries(onEntries, on[source.key], source.type, source.normalize);
  }
  return onEntries;
}

function validateOpenSpells(errors, ruleId, open) {
  const openSpells = asSelectorList(asObj(open).spells);
  if (!openSpells.length) {
    errors.push(`rule ${ruleId} open requires spells[]`);
    return;
  }
  const seenOpenSpells = new Set();
  for (const openSpellRaw of openSpells) {
    const openSpellId = normalizeSpellId(openSpellRaw);
    if (!openSpellId) {
      errors.push(`rule ${ruleId} open contains empty spell id`);
      continue;
    }
    if (seenOpenSpells.has(openSpellId)) {
      errors.push(`rule ${ruleId} open contains duplicate spell id: ${openSpellRaw}`);
    }
    seenOpenSpells.add(openSpellId);
    if (!hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, openSpellId)) {
      errors.push(`rule ${ruleId} open references inactive or unknown spell id: ${openSpellRaw}`);
    }
  }
}

function validateTriggerEventRef(errors, ruleId, trigger) {
  const eventId = normalizeEventId(asObj(trigger).event);
  if (!eventId) {
    errors.push(`rule ${ruleId} trigger is missing event`);
    return;
  }
  if (!hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
    errors.push(`rule ${ruleId} trigger references unknown event id: ${trigger.event}`);
  }
}

function validateTriggerArgs(errors, ruleId, rawTrigger, trigger) {
  if (typeof rawTrigger === "string" || !hasOwn(trigger, "args")) return;
  const args = trigger.args;
  if (!isObjectRecord(args)) {
    errors.push(`rule ${ruleId} trigger args must be an object when present`);
  }
}

function pushRuleTimingErrors(errors, context, obj) {
  pushFiniteNonNegativeErrorWhenPresent(errors, context, obj, "cooldownMs");
  pushFiniteNonNegativeErrorWhenPresent(errors, context, obj, "cooldown");
  pushFiniteAtLeastErrorWhenPresent(errors, context, obj, "matchWindowMs", MIN_MATCH_WINDOW_MS);
  pushFiniteAtLeastErrorWhenPresent(errors, context, obj, "matchWindow", MIN_MATCH_WINDOW_MS);
}

function pushOpenTimingErrors(errors, context, openObj) {
  pushFiniteNonNegativeErrorWhenPresent(errors, context, openObj, "ttlMs");
  pushFiniteNonNegativeErrorWhenPresent(errors, context, openObj, "ttl");
}

function validateStructuredOpen(errors, ruleId, openObj) {
  pushUnsupportedKeys(errors, `rule ${ruleId} open`, openObj, OPEN_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId} open`, openObj);
  pushOpenTimingErrors(errors, `rule ${ruleId} open`, openObj);
}

function validateRuleBaseFields(errors, ruleId, ruleObj) {
  const context = `rule ${ruleId}`;
  pushUnsupportedKeys(errors, context, ruleObj, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, context, ruleObj);
  pushFiniteNumberErrorWhenPresent(errors, context, ruleObj, "priority");
  pushRuleTimingErrors(errors, context, ruleObj);
}

function validateTriggerEntries(errors, ruleId, triggerEntries) {
  for (const rawTrigger of triggerEntries) {
    const trigger = (typeof rawTrigger === "string")
      ? Object.freeze({ event: rawTrigger })
      : asObj(rawTrigger);
    pushUnsupportedKeys(errors, `rule ${ruleId} trigger`, trigger, TRIGGER_ALLOWED_KEYS);
    pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId} trigger`, trigger);
    validateTriggerEventRef(errors, ruleId, trigger);
    validateTriggerArgs(errors, ruleId, rawTrigger, trigger);
  }
}

function validateOnSelectors(errors, ruleId, onEntries) {
  const seenOn = new Set();
  if (!Array.isArray(onEntries) || onEntries.length === 0) {
    errors.push(`rule ${ruleId} must define on selectors`);
  }
  for (const entry of onEntries) {
    const type = asText(entry?.type).toLowerCase();
    const id = asText(entry?.id).toLowerCase();
    if (!ON_SELECTOR_TYPES.has(type)) {
      errors.push(`rule ${ruleId} has unsupported on selector type`);
      continue;
    }
    if (!id) {
      errors.push(`rule ${ruleId} has empty on.${type}`);
      continue;
    }
    const dedupeKey = `${type}:${id}`;
    if (seenOn.has(dedupeKey)) {
      errors.push(`rule ${ruleId} contains duplicate on selector: ${type}.${id}`);
      continue;
    }
    seenOn.add(dedupeKey);
    const checker = ON_SELECTOR_ID_CHECKERS[type];
    if (typeof checker !== "function" || !checker(id)) {
      const label = ON_SELECTOR_ERROR_LABELS[type] || "unknown id";
      errors.push(`rule ${ruleId} references ${label}: ${entry.raw || id}`);
    }
  }
}

function validateDefaultsOpenSection(errors, defaults) {
  if (!hasOwn(defaults, "open")) return;
  const defaultsOpen = asObj(defaults.open);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, DEFAULTS_OPEN_ALLOWED_KEYS);
  pushOpenTimingErrors(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen);
}

function validateDefaultsRuleSection(errors, defaults) {
  if (!hasOwn(defaults, "rule")) return;
  const defaultsRule = asObj(defaults.rule);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, DEFAULTS_RULE_ALLOWED_KEYS);
  pushRuleTimingErrors(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule);
  pushFiniteNumberErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, "priority");
}

function validateDefaultsTriggerSection(errors, defaults) {
  if (!hasOwn(defaults, "trigger") && !hasOwn(defaults, "triggers")) return;
  const defaultsTrigger = Object.freeze({
    ...asObj(defaults.triggers),
    ...asObj(defaults.trigger),
  });
  for (const [rawEventId, args] of Object.entries(asObj(defaultsTrigger))) {
    const eventId = normalizeEventId(rawEventId);
    if (!eventId) {
      errors.push(`ORCHESTRATOR_V1.defaults.trigger has invalid event key: ${rawEventId}`);
      continue;
    }
    if (!hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
      errors.push(`ORCHESTRATOR_V1.defaults.trigger references unknown event id: ${rawEventId}`);
    }
    if (!isObjectRecord(args)) {
      errors.push(`ORCHESTRATOR_V1.defaults.trigger[${rawEventId}] must be an object`);
    }
  }
}

function validateDefaultsSection(errors, target) {
  if (!hasOwn(target, "defaults")) return;
  const defaults = asObj(target.defaults);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults", defaults, DEFAULTS_ALLOWED_KEYS);
  validateDefaultsOpenSection(errors, defaults);
  validateDefaultsTriggerSection(errors, defaults);
  validateDefaultsRuleSection(errors, defaults);
}

function validateRuleEntry(errors, seenRuleIds, rawRule) {
  const rule = asObj(rawRule);
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push("ORCHESTRATOR_V1.rules[] entry is missing id");
    return;
  }
  if (seenRuleIds.has(ruleId)) {
    errors.push(`ORCHESTRATOR_V1.rules contains duplicate id: ${ruleId}`);
  }
  seenRuleIds.add(ruleId);

  validateRuleBaseFields(errors, ruleId, rule);

  const onEntries = collectOnEntries(rule.on, errors, ruleId);
  validateOnSelectors(errors, ruleId, onEntries);

  const hasOpen = validateRuleOpenSection(errors, ruleId, rule);
  validateRuleTriggerSection(errors, ruleId, rule, hasOpen);
}

function validateRuleOpenSection(errors, ruleId, rule) {
  const hasOpen = hasOwn(rule, "open");
  if (!hasOpen) return false;
  const openIsSelectorList = isSelectorListLike(rule.open);
  const open = openIsSelectorList
    ? Object.freeze({ spells: asSelectorList(rule.open) })
    : asObj(rule.open);
  if (!openIsSelectorList) {
    validateStructuredOpen(errors, ruleId, open);
  }
  validateOpenSpells(errors, ruleId, open);
  return true;
}

function validateRuleTriggerSection(errors, ruleId, rule, hasOpen) {
  const triggerEntries = [
    ...normalizeTriggerEntries(rule.trigger),
    ...normalizeTriggerEntries(rule.triggers),
  ];
  if (!Array.isArray(triggerEntries) || triggerEntries.length === 0) {
    if (!hasOpen) {
      errors.push(`rule ${ruleId} must define open and/or trigger actions`);
    }
    return;
  }
  validateTriggerEntries(errors, ruleId, triggerEntries);
}

function validateRootShape(errors, target) {
  if (asText(target.version) !== "1") {
    errors.push("ORCHESTRATOR_V1.version must be \"1\"");
  }
  if (typeof target.enabled !== "boolean") {
    errors.push("ORCHESTRATOR_V1.enabled must be boolean");
  }
  if (!Array.isArray(target.rules)) {
    errors.push("ORCHESTRATOR_V1.rules must be an array");
    return false;
  }
  return true;
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1", target, ROOT_ALLOWED_KEYS);
  if (!validateRootShape(errors, target)) return errors;
  validateDefaultsSection(errors, target);
  const ids = new Set();
  for (const rawRule of target.rules) {
    validateRuleEntry(errors, ids, rawRule);
  }
  return errors;
}
