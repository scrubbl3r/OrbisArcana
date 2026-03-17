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
    const defaults = asObj(target.defaults);
    pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults", defaults, DEFAULTS_ALLOWED_KEYS);
    if (hasOwn(defaults, "open")) {
      const defaultsOpen = asObj(defaults.open);
      pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, DEFAULTS_OPEN_ALLOWED_KEYS);
      if (hasOwn(defaultsOpen, "ttlMs") && !isFiniteNonNegative(defaultsOpen.ttlMs)) {
        errors.push(`ORCHESTRATOR_V1.defaults.open.ttlMs must be a finite number >= ${MIN_NONNEGATIVE} when present`);
      }
      if (hasOwn(defaultsOpen, "ttl") && !isFiniteNonNegative(defaultsOpen.ttl)) {
        errors.push(`ORCHESTRATOR_V1.defaults.open.ttl must be a finite number >= ${MIN_NONNEGATIVE} when present`);
      }
    }
    if (
      hasOwn(defaults, "trigger") ||
      hasOwn(defaults, "triggers")
    ) {
      const defaultsTrigger = getMergedDefaultsTriggerMap(defaults);
      for (const [rawEventId, args] of Object.entries(defaultsTrigger)) {
        const eventId = normalizeEventId(rawEventId);
        if (!eventId) {
          errors.push(`ORCHESTRATOR_V1.defaults.trigger has invalid event key: ${rawEventId}`);
          continue;
        }
        if (!hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
          errors.push(`ORCHESTRATOR_V1.defaults.trigger references unknown event id: ${rawEventId}`);
        }
        if (!args || typeof args !== "object" || Array.isArray(args)) {
          errors.push(`ORCHESTRATOR_V1.defaults.trigger[${rawEventId}] must be an object`);
        }
      }
    }
    if (hasOwn(defaults, "rule")) {
      const defaultsRule = asObj(defaults.rule);
      pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, DEFAULTS_RULE_ALLOWED_KEYS);
      if (hasOwn(defaultsRule, "cooldownMs") && !isFiniteNonNegative(defaultsRule.cooldownMs)) {
        errors.push(`ORCHESTRATOR_V1.defaults.rule.cooldownMs must be a finite number >= ${MIN_NONNEGATIVE} when present`);
      }
      if (hasOwn(defaultsRule, "cooldown") && !isFiniteNonNegative(defaultsRule.cooldown)) {
        errors.push(`ORCHESTRATOR_V1.defaults.rule.cooldown must be a finite number >= ${MIN_NONNEGATIVE} when present`);
      }
      if (hasOwn(defaultsRule, "matchWindowMs")) {
        if (!isFiniteAtLeast(defaultsRule.matchWindowMs, MIN_MATCH_WINDOW_MS)) {
          errors.push(`ORCHESTRATOR_V1.defaults.rule.matchWindowMs must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`);
        }
      }
      if (hasOwn(defaultsRule, "matchWindow")) {
        if (!isFiniteAtLeast(defaultsRule.matchWindow, MIN_MATCH_WINDOW_MS)) {
          errors.push(`ORCHESTRATOR_V1.defaults.rule.matchWindow must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`);
        }
      }
      if (hasOwn(defaultsRule, "priority") && !isFiniteNumber(defaultsRule.priority)) {
        errors.push("ORCHESTRATOR_V1.defaults.rule.priority must be a finite number when present");
      }
    }
  }

  const ids = new Set();
  for (const rawRule of target.rules) {
    const rule = asObj(rawRule);
    const ruleId = asText(rule.id);
    if (!ruleId) {
      errors.push("ORCHESTRATOR_V1.rules[] entry is missing id");
      continue;
    }
    if (ids.has(ruleId)) errors.push(`ORCHESTRATOR_V1.rules contains duplicate id: ${ruleId}`);
    ids.add(ruleId);

    pushUnsupportedKeys(errors, `rule ${ruleId}`, rule, RULE_ALLOWED_KEYS);
    if (hasOwn(rule, "enabled") && typeof rule.enabled !== "boolean") {
      errors.push(`rule ${ruleId} enabled must be boolean when present`);
    }
    if (hasOwn(rule, "priority") && !isFiniteNumber(rule.priority)) {
      errors.push(`rule ${ruleId} priority must be a finite number when present`);
    }
    if (hasOwn(rule, "cooldownMs") && !isFiniteNonNegative(rule.cooldownMs)) {
      errors.push(`rule ${ruleId} cooldownMs must be a finite number >= ${MIN_NONNEGATIVE} when present`);
    }
    if (hasOwn(rule, "cooldown") && !isFiniteNonNegative(rule.cooldown)) {
      errors.push(`rule ${ruleId} cooldown must be a finite number >= ${MIN_NONNEGATIVE} when present`);
    }
    if (hasOwn(rule, "matchWindowMs")) {
      if (!isFiniteAtLeast(rule.matchWindowMs, MIN_MATCH_WINDOW_MS)) {
        errors.push(`rule ${ruleId} matchWindowMs must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`);
      }
    }
    if (hasOwn(rule, "matchWindow")) {
      if (!isFiniteAtLeast(rule.matchWindow, MIN_MATCH_WINDOW_MS)) {
        errors.push(`rule ${ruleId} matchWindow must be a finite number >= ${MIN_MATCH_WINDOW_MS} when present`);
      }
    }

    const onEntries = collectOnEntries(rule.on, errors, ruleId);

    const seenOn = new Set();
    if (!onEntries.length) {
      errors.push(`rule ${ruleId} must define on selectors`);
    }
    for (const entry of onEntries) {
      const type = asText(entry?.type).toLowerCase();
      const id = asText(entry?.id).toLowerCase();
      if (!isKnownOnSelectorType(type)) {
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
      if (!hasKnownOnSelectorId(type, id)) {
        const label = ON_SELECTOR_ERROR_LABELS[type] || "unknown id";
        errors.push(`rule ${ruleId} references ${label}: ${entry.raw || id}`);
      }
    }

    const hasOpen = hasOwn(rule, "open");
    if (hasOpen) {
      const openIsSelectorList = isSelectorListLike(rule.open);
      const open = openIsSelectorList
        ? Object.freeze({ spells: asSelectorList(rule.open) })
        : asObj(rule.open);
      if (!openIsSelectorList) {
        pushUnsupportedKeys(errors, `rule ${ruleId} open`, open, OPEN_ALLOWED_KEYS);
      }
      const openSpells = asSelectorList(open.spells);
      if (!openSpells.length) {
        errors.push(`rule ${ruleId} open requires spells[]`);
      } else {
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
      if (!openIsSelectorList &&
        hasOwn(open, "enabled") && typeof open.enabled !== "boolean") {
        errors.push(`rule ${ruleId} open enabled must be boolean when present`);
      }
      if (!openIsSelectorList &&
        hasOwn(open, "ttlMs") && !isFiniteNonNegative(open.ttlMs)) {
        errors.push(`rule ${ruleId} open ttlMs must be a finite number >= ${MIN_NONNEGATIVE} when present`);
      }
      if (!openIsSelectorList &&
        hasOwn(open, "ttl") && !isFiniteNonNegative(open.ttl)) {
        errors.push(`rule ${ruleId} open ttl must be a finite number >= ${MIN_NONNEGATIVE} when present`);
      }
    }

    const triggerEntries = getMergedTriggerEntries(rule);
    const hasTrigger = triggerEntries.length > 0;
    if (!hasTrigger && !hasOpen) {
      errors.push(`rule ${ruleId} must define open and/or trigger actions`);
      continue;
    }
    if (!hasTrigger) {
      continue;
    }
    for (const rawTrigger of triggerEntries) {
      const isStringTrigger = typeof rawTrigger === "string";
      const trigger = isStringTrigger ? Object.freeze({ event: rawTrigger }) : asObj(rawTrigger);
      pushUnsupportedKeys(errors, `rule ${ruleId} trigger`, trigger, TRIGGER_ALLOWED_KEYS);
      if (hasOwn(trigger, "enabled") && typeof trigger.enabled !== "boolean") {
        errors.push(`rule ${ruleId} trigger enabled must be boolean when present`);
      }
      const eventId = normalizeEventId(trigger.event);
      if (!eventId) {
        errors.push(`rule ${ruleId} trigger is missing event`);
      } else if (!hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`rule ${ruleId} trigger references unknown event id: ${trigger.event}`);
      }
      if (!isStringTrigger && hasOwn(trigger, "args")) {
        const args = trigger.args;
        if (!args || typeof args !== "object" || Array.isArray(args)) {
          errors.push(`rule ${ruleId} trigger args must be an object when present`);
        }
      }
    }
  }
  return errors;
}
