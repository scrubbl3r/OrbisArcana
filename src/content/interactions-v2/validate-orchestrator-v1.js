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

function getMergedTriggerEntries(ruleLike) {
  const source = asObj(ruleLike);
  return [
    ...normalizeTriggerEntries(source.trigger),
    ...normalizeTriggerEntries(source.triggers),
  ];
}

function getMergedDefaultsTriggerMap(defaultsLike) {
  const defaults = asObj(defaultsLike);
  return Object.freeze({
    ...asObj(defaults.triggers),
    ...asObj(defaults.trigger),
  });
}

function hasMergedDefaultsTriggerEntries(defaultsLike) {
  const defaults = asObj(defaultsLike);
  return hasOwn(defaults, "trigger") || hasOwn(defaults, "triggers");
}

function hasDefaultsOpen(defaultsLike) {
  return hasOwn(asObj(defaultsLike), "open");
}

function hasDefaultsRule(defaultsLike) {
  return hasOwn(asObj(defaultsLike), "rule");
}

function getDefaultsOpen(defaultsLike) {
  return asObj(asObj(defaultsLike).open);
}

function getDefaultsRule(defaultsLike) {
  return asObj(asObj(defaultsLike).rule);
}

function getValidationDefaults(targetLike) {
  return asObj(asObj(targetLike).defaults);
}

function hasRuleOpen(ruleLike) {
  return hasOwn(asObj(ruleLike), "open");
}

function getRuleTriggerEntries(ruleLike) {
  return getMergedTriggerEntries(ruleLike);
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

function isKnownOnSelectorType(type) {
  return ON_SELECTOR_TYPES.has(type);
}

function hasKnownOnSelectorId(type, id) {
  const checker = ON_SELECTOR_ID_CHECKERS[type];
  return typeof checker === "function" ? checker(id) : false;
}

function buildOnSelectorDedupeKey(type, id) {
  return `${type}:${id}`;
}

function normalizeTriggerValidationInput(rawTrigger) {
  return (typeof rawTrigger === "string")
    ? Object.freeze({ event: rawTrigger })
    : asObj(rawTrigger);
}

function normalizeOnSelectorEntry(entry) {
  return Object.freeze({
    type: asText(entry?.type).toLowerCase(),
    id: asText(entry?.id).toLowerCase(),
  });
}

function normalizeRuleValidationId(rawRule) {
  return asText(asObj(rawRule).id);
}

function normalizeOpenValidationInput(rawOpen) {
  return isSelectorListLike(rawOpen)
    ? Object.freeze({ spells: asSelectorList(rawOpen) })
    : asObj(rawOpen);
}

function isOpenSelectorList(rawOpen) {
  return isSelectorListLike(rawOpen);
}

function isStringTriggerEntry(rawTrigger) {
  return typeof rawTrigger === "string";
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

function validateDefaultsTriggerEntry(errors, rawEventId, args) {
  const eventId = normalizeEventId(rawEventId);
  if (!eventId) {
    errors.push(`ORCHESTRATOR_V1.defaults.trigger has invalid event key: ${rawEventId}`);
    return;
  }
  if (!hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
    errors.push(`ORCHESTRATOR_V1.defaults.trigger references unknown event id: ${rawEventId}`);
  }
  if (!isObjectRecord(args)) {
    errors.push(`ORCHESTRATOR_V1.defaults.trigger[${rawEventId}] must be an object`);
  }
}

function validateTriggerArgs(errors, ruleId, rawTrigger, trigger) {
  if (isStringTriggerEntry(rawTrigger) || !hasOwn(trigger, "args")) return;
  const args = trigger.args;
  if (!isObjectRecord(args)) {
    errors.push(`rule ${ruleId} trigger args must be an object when present`);
  }
}

function pushUnsupportedOnSelectorTypeError(errors, ruleId) {
  errors.push(`rule ${ruleId} has unsupported on selector type`);
}

function pushMissingOnSelectorsError(errors, ruleId) {
  errors.push(`rule ${ruleId} must define on selectors`);
}

function pushMissingActionsError(errors, ruleId) {
  errors.push(`rule ${ruleId} must define open and/or trigger actions`);
}

function pushEmptyOnSelectorError(errors, ruleId, type) {
  errors.push(`rule ${ruleId} has empty on.${type}`);
}

function pushDuplicateOnSelectorError(errors, ruleId, type, id) {
  errors.push(`rule ${ruleId} contains duplicate on selector: ${type}.${id}`);
}

function getOnSelectorErrorLabel(type) {
  return ON_SELECTOR_ERROR_LABELS[type] || "unknown id";
}

function pushUnknownOnSelectorIdError(errors, ruleId, type, rawOrId) {
  const label = getOnSelectorErrorLabel(type);
  errors.push(`rule ${ruleId} references ${label}: ${rawOrId}`);
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

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1", target, ROOT_ALLOWED_KEYS);

  if (asText(target.version) !== "1") {
    errors.push("ORCHESTRATOR_V1.version must be \"1\"");
  }
  if (typeof target.enabled !== "boolean") {
    errors.push("ORCHESTRATOR_V1.enabled must be boolean");
  }
  if (!Array.isArray(target.rules)) {
    errors.push("ORCHESTRATOR_V1.rules must be an array");
    return errors;
  }
  if (hasOwn(target, "defaults")) {
    const defaults = getValidationDefaults(target);
    pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults", defaults, DEFAULTS_ALLOWED_KEYS);
    if (hasDefaultsOpen(defaults)) {
      const defaultsOpen = getDefaultsOpen(defaults);
      pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, DEFAULTS_OPEN_ALLOWED_KEYS);
      pushOpenTimingErrors(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen);
    }
    if (hasMergedDefaultsTriggerEntries(defaults)) {
      const defaultsTrigger = getMergedDefaultsTriggerMap(defaults);
      for (const [rawEventId, args] of Object.entries(defaultsTrigger)) {
        validateDefaultsTriggerEntry(errors, rawEventId, args);
      }
    }
    if (hasDefaultsRule(defaults)) {
      const defaultsRule = getDefaultsRule(defaults);
      pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, DEFAULTS_RULE_ALLOWED_KEYS);
      pushRuleTimingErrors(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule);
      pushFiniteNumberErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, "priority");
    }
  }

  const ids = new Set();
  for (const rawRule of target.rules) {
    const rule = asObj(rawRule);
    const ruleId = normalizeRuleValidationId(rule);
    if (!ruleId) {
      errors.push("ORCHESTRATOR_V1.rules[] entry is missing id");
      continue;
    }
    if (ids.has(ruleId)) errors.push(`ORCHESTRATOR_V1.rules contains duplicate id: ${ruleId}`);
    ids.add(ruleId);

    pushUnsupportedKeys(errors, `rule ${ruleId}`, rule, RULE_ALLOWED_KEYS);
    pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId}`, rule);
    pushFiniteNumberErrorWhenPresent(errors, `rule ${ruleId}`, rule, "priority");
    pushRuleTimingErrors(errors, `rule ${ruleId}`, rule);

    const onEntries = collectOnEntries(rule.on, errors, ruleId);

    const seenOn = new Set();
    if (!onEntries.length) {
      pushMissingOnSelectorsError(errors, ruleId);
    }
    for (const entry of onEntries) {
      const normalized = normalizeOnSelectorEntry(entry);
      const type = normalized.type;
      const id = normalized.id;
      if (!isKnownOnSelectorType(type)) {
        pushUnsupportedOnSelectorTypeError(errors, ruleId);
        continue;
      }
      if (!id) {
        pushEmptyOnSelectorError(errors, ruleId, type);
        continue;
      }
      const dedupeKey = buildOnSelectorDedupeKey(type, id);
      if (seenOn.has(dedupeKey)) {
        pushDuplicateOnSelectorError(errors, ruleId, type, id);
        continue;
      }
      seenOn.add(dedupeKey);
      if (!hasKnownOnSelectorId(type, id)) {
        pushUnknownOnSelectorIdError(errors, ruleId, type, entry.raw || id);
      }
    }

    const hasOpen = hasRuleOpen(rule);
    if (hasOpen) {
      const openIsSelectorList = isOpenSelectorList(rule.open);
      const open = normalizeOpenValidationInput(rule.open);
      if (!openIsSelectorList) {
        pushUnsupportedKeys(errors, `rule ${ruleId} open`, open, OPEN_ALLOWED_KEYS);
      }
      validateOpenSpells(errors, ruleId, open);
      if (!openIsSelectorList) {
        pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId} open`, open);
        pushOpenTimingErrors(errors, `rule ${ruleId} open`, open);
      }
    }

    const triggerEntries = getRuleTriggerEntries(rule);
    const hasTrigger = triggerEntries.length > 0;
    if (!hasTrigger) {
      if (!hasOpen) {
        pushMissingActionsError(errors, ruleId);
      }
      continue;
    }
    for (const rawTrigger of triggerEntries) {
      const trigger = normalizeTriggerValidationInput(rawTrigger);
      pushUnsupportedKeys(errors, `rule ${ruleId} trigger`, trigger, TRIGGER_ALLOWED_KEYS);
      pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId} trigger`, trigger);
      validateTriggerEventRef(errors, ruleId, trigger);
      validateTriggerArgs(errors, ruleId, rawTrigger, trigger);
    }
  }
  return errors;
}
