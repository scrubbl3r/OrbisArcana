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

function isObjectRecord(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

const MIN_NONNEGATIVE = 0;
const MIN_MATCH_WINDOW_MS = 100;

function pushUnsupportedKeys(errors, context, obj, allowedKeys) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(asObj(obj))) {
    if (!allowed.has(key)) errors.push(`${context} contains unsupported key: ${key}`);
  }
}

function pushFiniteAtLeastErrorWhenPresent(errors, context, obj, key, min) {
  const source = asObj(obj);
  if (!Object.hasOwn(source, key)) return;
  const n = Number(source[key]);
  if (!Number.isFinite(n) || n < min) {
    const keyPath = context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`;
    errors.push(`${keyPath} must be a finite number >= ${min} when present`);
  }
}

function pushFiniteNonNegativeErrorWhenPresent(errors, context, obj, key) {
  const source = asObj(obj);
  if (!Object.hasOwn(source, key)) return;
  const n = Number(source[key]);
  if (!Number.isFinite(n) || n < MIN_NONNEGATIVE) {
    const keyPath = context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`;
    errors.push(`${keyPath} must be a finite number >= ${MIN_NONNEGATIVE} when present`);
  }
}

function pushBooleanEnabledErrorWhenPresent(errors, context, obj) {
  const source = asObj(obj);
  if (Object.hasOwn(source, "enabled") && typeof source.enabled !== "boolean") {
    errors.push(`${context} enabled must be boolean when present`);
  }
}

function pushFiniteNumberErrorWhenPresent(errors, context, obj, key) {
  const source = asObj(obj);
  if (Object.hasOwn(source, key) && !Number.isFinite(Number(source[key]))) {
    const keyPath = context.startsWith("rule ") ? `${context} ${key}` : `${context}.${key}`;
    errors.push(`${keyPath} must be a finite number when present`);
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
  spell: (id) => Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id),
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
    if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, openSpellId)) {
      errors.push(`rule ${ruleId} open references inactive or unknown spell id: ${openSpellRaw}`);
    }
  }
}

function validateTriggerEntries(errors, ruleId, triggerEntries) {
  for (const rawTrigger of triggerEntries) {
    const trigger = (typeof rawTrigger === "string")
      ? { event: rawTrigger }
      : asObj(rawTrigger);
    pushUnsupportedKeys(errors, `rule ${ruleId} trigger`, trigger, TRIGGER_ALLOWED_KEYS);
    pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId} trigger`, trigger);

    const eventId = normalizeEventId(trigger.event);
    if (!eventId) {
      errors.push(`rule ${ruleId} trigger is missing event`);
    } else if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
      errors.push(`rule ${ruleId} trigger references unknown event id: ${trigger.event}`);
    }

    if (typeof rawTrigger !== "string" && Object.hasOwn(trigger, "args")) {
      const args = trigger.args;
      if (!isObjectRecord(args)) {
        errors.push(`rule ${ruleId} trigger args must be an object when present`);
      }
    }
  }
}

function validateOnSelectors(errors, ruleId, onEntries) {
  const seenOn = new Set();
  if (!onEntries.length) {
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

function validateDefaultsSection(errors, target) {
  if (!Object.hasOwn(target, "defaults")) return;
  const defaults = asObj(target.defaults);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults", defaults, DEFAULTS_ALLOWED_KEYS);

  if (Object.hasOwn(defaults, "open")) {
    const defaultsOpen = asObj(defaults.open);
    pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, DEFAULTS_OPEN_ALLOWED_KEYS);
    pushFiniteNonNegativeErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, "ttlMs");
    pushFiniteNonNegativeErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, "ttl");
  }

  if (Object.hasOwn(defaults, "trigger") || Object.hasOwn(defaults, "triggers")) {
    const defaultsTrigger = {
      ...asObj(defaults.triggers),
      ...asObj(defaults.trigger),
    };
    for (const [rawEventId, args] of Object.entries(defaultsTrigger)) {
      const eventId = normalizeEventId(rawEventId);
      if (!eventId) {
        errors.push(`ORCHESTRATOR_V1.defaults.trigger has invalid event key: ${rawEventId}`);
        continue;
      }
      if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`ORCHESTRATOR_V1.defaults.trigger references unknown event id: ${rawEventId}`);
      }
      if (!isObjectRecord(args)) {
        errors.push(`ORCHESTRATOR_V1.defaults.trigger[${rawEventId}] must be an object`);
      }
    }
  }

  if (Object.hasOwn(defaults, "rule")) {
    const defaultsRule = asObj(defaults.rule);
    pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, DEFAULTS_RULE_ALLOWED_KEYS);
    pushFiniteNonNegativeErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, "cooldownMs");
    pushFiniteNonNegativeErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, "cooldown");
    pushFiniteAtLeastErrorWhenPresent(
      errors,
      "ORCHESTRATOR_V1.defaults.rule",
      defaultsRule,
      "matchWindowMs",
      MIN_MATCH_WINDOW_MS
    );
    pushFiniteAtLeastErrorWhenPresent(
      errors,
      "ORCHESTRATOR_V1.defaults.rule",
      defaultsRule,
      "matchWindow",
      MIN_MATCH_WINDOW_MS
    );
    pushFiniteNumberErrorWhenPresent(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, "priority");
  }
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

  const context = `rule ${ruleId}`;
  pushUnsupportedKeys(errors, context, rule, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, context, rule);
  pushFiniteNumberErrorWhenPresent(errors, context, rule, "priority");
  pushFiniteNonNegativeErrorWhenPresent(errors, context, rule, "cooldownMs");
  pushFiniteNonNegativeErrorWhenPresent(errors, context, rule, "cooldown");
  pushFiniteAtLeastErrorWhenPresent(errors, context, rule, "matchWindowMs", MIN_MATCH_WINDOW_MS);
  pushFiniteAtLeastErrorWhenPresent(errors, context, rule, "matchWindow", MIN_MATCH_WINDOW_MS);

  const onEntries = [];
  if (typeof rule.on === "string" || Array.isArray(rule.on)) {
    for (const entry of asSelectorList(rule.on)) {
      onEntries.push(parseOnSelector(entry, { invalidAsEmptyObject: true }));
    }
  } else {
    const on = asObj(rule.on);
    pushUnsupportedKeys(errors, `rule ${ruleId} on`, on, ON_SELECTOR_ALLOWED_KEYS);
    for (const source of ON_SELECTOR_SOURCES) {
      if (!Object.hasOwn(on, source.key)) continue;
      for (const value of asSelectorList(on[source.key])) {
        onEntries.push({ type: source.type, id: source.normalize(value), raw: value });
      }
    }
  }
  validateOnSelectors(errors, ruleId, onEntries);

  const hasOpen = Object.hasOwn(rule, "open");
  if (hasOpen) {
    const openIsSelectorList = typeof rule.open === "string" || Array.isArray(rule.open);
    const open = openIsSelectorList
      ? { spells: asSelectorList(rule.open) }
      : asObj(rule.open);
    if (!openIsSelectorList) {
      pushUnsupportedKeys(errors, `rule ${ruleId} open`, open, OPEN_ALLOWED_KEYS);
      pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId} open`, open);
      pushFiniteNonNegativeErrorWhenPresent(errors, `rule ${ruleId} open`, open, "ttlMs");
      pushFiniteNonNegativeErrorWhenPresent(errors, `rule ${ruleId} open`, open, "ttl");
    }
    validateOpenSpells(errors, ruleId, open);
  }

  const triggerEntries = [
    ...normalizeTriggerEntries(rule.trigger),
    ...normalizeTriggerEntries(rule.triggers),
  ];
  if (!triggerEntries.length) {
    if (!hasOpen) {
      errors.push(`rule ${ruleId} must define open and/or trigger actions`);
    }
    return;
  }
  validateTriggerEntries(errors, ruleId, triggerEntries);
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
  validateDefaultsSection(errors, target);
  const ids = new Set();
  for (const rawRule of target.rules) {
    validateRuleEntry(errors, ids, rawRule);
  }
  return errors;
}
