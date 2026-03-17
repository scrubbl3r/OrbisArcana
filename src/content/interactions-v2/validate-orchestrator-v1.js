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

function pushOnEntries(onEntries, raw, type, normalizeId) {
  for (const value of asSelectorList(raw)) {
    onEntries.push(Object.freeze({ type, id: normalizeId(value), raw: value }));
  }
}

function getMergedTriggerEntries(ruleLike) {
  const source = asObj(ruleLike);
  return [
    ...normalizeTriggerEntries(source.trigger),
    ...normalizeTriggerEntries(source.triggers),
  ];
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1", target, ["version", "enabled", "defaults", "rules"]);

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
  if (Object.prototype.hasOwnProperty.call(target, "defaults")) {
    const defaults = asObj(target.defaults);
    pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults", defaults, ["open", "trigger", "triggers", "rule"]);
    if (Object.prototype.hasOwnProperty.call(defaults, "open")) {
      const defaultsOpen = asObj(defaults.open);
      pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.open", defaultsOpen, ["ttlMs", "ttl"]);
      if (Object.prototype.hasOwnProperty.call(defaultsOpen, "ttlMs") && !isFiniteNonNegative(defaultsOpen.ttlMs)) {
        errors.push("ORCHESTRATOR_V1.defaults.open.ttlMs must be a finite number >= 0 when present");
      }
      if (Object.prototype.hasOwnProperty.call(defaultsOpen, "ttl") && !isFiniteNonNegative(defaultsOpen.ttl)) {
        errors.push("ORCHESTRATOR_V1.defaults.open.ttl must be a finite number >= 0 when present");
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(defaults, "trigger") ||
      Object.prototype.hasOwnProperty.call(defaults, "triggers")
    ) {
      const defaultsTrigger = Object.freeze({
        ...asObj(defaults.triggers),
        ...asObj(defaults.trigger),
      });
      for (const [rawEventId, args] of Object.entries(defaultsTrigger)) {
        const eventId = normalizeEventId(rawEventId);
        if (!eventId) {
          errors.push(`ORCHESTRATOR_V1.defaults.trigger has invalid event key: ${rawEventId}`);
          continue;
        }
        if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_BY_ID, eventId)) {
          errors.push(`ORCHESTRATOR_V1.defaults.trigger references unknown event id: ${rawEventId}`);
        }
        if (!args || typeof args !== "object" || Array.isArray(args)) {
          errors.push(`ORCHESTRATOR_V1.defaults.trigger[${rawEventId}] must be an object`);
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(defaults, "rule")) {
      const defaultsRule = asObj(defaults.rule);
      pushUnsupportedKeys(errors, "ORCHESTRATOR_V1.defaults.rule", defaultsRule, [
        "cooldownMs",
        "cooldown",
        "matchWindowMs",
        "matchWindow",
        "priority",
      ]);
      if (Object.prototype.hasOwnProperty.call(defaultsRule, "cooldownMs") && !isFiniteNonNegative(defaultsRule.cooldownMs)) {
        errors.push("ORCHESTRATOR_V1.defaults.rule.cooldownMs must be a finite number >= 0 when present");
      }
      if (Object.prototype.hasOwnProperty.call(defaultsRule, "cooldown") && !isFiniteNonNegative(defaultsRule.cooldown)) {
        errors.push("ORCHESTRATOR_V1.defaults.rule.cooldown must be a finite number >= 0 when present");
      }
      if (Object.prototype.hasOwnProperty.call(defaultsRule, "matchWindowMs")) {
        const n = Number(defaultsRule.matchWindowMs);
        if (!Number.isFinite(n) || n < 100) {
          errors.push("ORCHESTRATOR_V1.defaults.rule.matchWindowMs must be a finite number >= 100 when present");
        }
      }
      if (Object.prototype.hasOwnProperty.call(defaultsRule, "matchWindow")) {
        const n = Number(defaultsRule.matchWindow);
        if (!Number.isFinite(n) || n < 100) {
          errors.push("ORCHESTRATOR_V1.defaults.rule.matchWindow must be a finite number >= 100 when present");
        }
      }
      const priorityNum = Number(defaultsRule.priority);
      if (Object.prototype.hasOwnProperty.call(defaultsRule, "priority") && !Number.isFinite(priorityNum)) {
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

    pushUnsupportedKeys(errors, `rule ${ruleId}`, rule, [
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
    if (Object.prototype.hasOwnProperty.call(rule, "enabled") && typeof rule.enabled !== "boolean") {
      errors.push(`rule ${ruleId} enabled must be boolean when present`);
    }
    const rulePriorityNum = Number(rule.priority);
    if (Object.prototype.hasOwnProperty.call(rule, "priority") && !Number.isFinite(rulePriorityNum)) {
      errors.push(`rule ${ruleId} priority must be a finite number when present`);
    }
    if (Object.prototype.hasOwnProperty.call(rule, "cooldownMs") && !isFiniteNonNegative(rule.cooldownMs)) {
      errors.push(`rule ${ruleId} cooldownMs must be a finite number >= 0 when present`);
    }
    if (Object.prototype.hasOwnProperty.call(rule, "cooldown") && !isFiniteNonNegative(rule.cooldown)) {
      errors.push(`rule ${ruleId} cooldown must be a finite number >= 0 when present`);
    }
    if (Object.prototype.hasOwnProperty.call(rule, "matchWindowMs")) {
      const n = Number(rule.matchWindowMs);
      if (!Number.isFinite(n) || n < 100) {
        errors.push(`rule ${ruleId} matchWindowMs must be a finite number >= 100 when present`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(rule, "matchWindow")) {
      const n = Number(rule.matchWindow);
      if (!Number.isFinite(n) || n < 100) {
        errors.push(`rule ${ruleId} matchWindow must be a finite number >= 100 when present`);
      }
    }

    const onRaw = rule.on;
    const onEntries = [];
    if (typeof onRaw === "string") {
      for (const entry of asSelectorList(onRaw)) {
        onEntries.push(parseOnSelector(entry, { invalidAsEmptyObject: true }));
      }
    } else if (Array.isArray(onRaw)) {
      for (const entry of asSelectorList(onRaw)) {
        onEntries.push(parseOnSelector(entry, { invalidAsEmptyObject: true }));
      }
    } else {
      const on = asObj(onRaw);
      pushUnsupportedKeys(errors, `rule ${ruleId} on`, on, [
        "spell",
        "spells",
        "gesture",
        "gestures",
        "orb_state",
        "orbState",
        "orbStates",
      ]);
      if (Object.prototype.hasOwnProperty.call(on, "spell")) pushOnEntries(onEntries, on.spell, "spell", normalizeSpellId);
      if (Object.prototype.hasOwnProperty.call(on, "spells")) pushOnEntries(onEntries, on.spells, "spell", normalizeSpellId);
      if (Object.prototype.hasOwnProperty.call(on, "gesture")) pushOnEntries(onEntries, on.gesture, "gesture", normalizeGestureId);
      if (Object.prototype.hasOwnProperty.call(on, "gestures")) pushOnEntries(onEntries, on.gestures, "gesture", normalizeGestureId);
      if (Object.prototype.hasOwnProperty.call(on, "orb_state")) pushOnEntries(onEntries, on.orb_state, "orb_state", normalizeOrbStateId);
      if (Object.prototype.hasOwnProperty.call(on, "orbState")) pushOnEntries(onEntries, on.orbState, "orb_state", normalizeOrbStateId);
      if (Object.prototype.hasOwnProperty.call(on, "orbStates")) pushOnEntries(onEntries, on.orbStates, "orb_state", normalizeOrbStateId);
    }

    const seenOn = new Set();
    if (!onEntries.length) {
      errors.push(`rule ${ruleId} must define on selectors`);
    }
    for (const entry of onEntries) {
      const type = asText(entry?.type).toLowerCase();
      const id = asText(entry?.id).toLowerCase();
      if (type !== "spell" && type !== "gesture" && type !== "orb_state") {
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
      if (type === "spell" && !Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id)) {
        errors.push(`rule ${ruleId} references inactive or unknown spell id: ${entry.raw || id}`);
      }
      if (type === "gesture" && !KNOWN_GESTURE_IDS.has(id)) {
        errors.push(`rule ${ruleId} references unknown gesture id: ${entry.raw || id}`);
      }
      if (type === "orb_state" && !KNOWN_ORB_STATE_IDS.has(id)) {
        errors.push(`rule ${ruleId} references unknown orb_state id: ${entry.raw || id}`);
      }
    }

    const hasOpen = Object.prototype.hasOwnProperty.call(rule, "open");
    if (hasOpen) {
      const isStringOpen = typeof rule.open === "string";
      const isArrayOpen = Array.isArray(rule.open);
      const open = (isStringOpen || isArrayOpen)
        ? Object.freeze({ spells: asSelectorList(rule.open) })
        : asObj(rule.open);
      if (!isStringOpen && !isArrayOpen) {
        pushUnsupportedKeys(errors, `rule ${ruleId} open`, open, ["spells", "ttlMs", "ttl", "enabled"]);
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
          if (!Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, openSpellId)) {
            errors.push(`rule ${ruleId} open references inactive or unknown spell id: ${openSpellRaw}`);
          }
        }
      }
      if (!isStringOpen && !isArrayOpen &&
        Object.prototype.hasOwnProperty.call(open, "enabled") && typeof open.enabled !== "boolean") {
        errors.push(`rule ${ruleId} open enabled must be boolean when present`);
      }
      if (!isStringOpen && !isArrayOpen &&
        Object.prototype.hasOwnProperty.call(open, "ttlMs") && !isFiniteNonNegative(open.ttlMs)) {
        errors.push(`rule ${ruleId} open ttlMs must be a finite number >= 0 when present`);
      }
      if (!isStringOpen && !isArrayOpen &&
        Object.prototype.hasOwnProperty.call(open, "ttl") && !isFiniteNonNegative(open.ttl)) {
        errors.push(`rule ${ruleId} open ttl must be a finite number >= 0 when present`);
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
      pushUnsupportedKeys(errors, `rule ${ruleId} trigger`, trigger, ["event", "enabled", "args"]);
      if (Object.prototype.hasOwnProperty.call(trigger, "enabled") && typeof trigger.enabled !== "boolean") {
        errors.push(`rule ${ruleId} trigger enabled must be boolean when present`);
      }
      const eventId = normalizeEventId(trigger.event);
      if (!eventId) {
        errors.push(`rule ${ruleId} trigger is missing event`);
      } else if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`rule ${ruleId} trigger references unknown event id: ${trigger.event}`);
      }
      if (!isStringTrigger && Object.prototype.hasOwnProperty.call(trigger, "args")) {
        const args = trigger.args;
        if (!args || typeof args !== "object" || Array.isArray(args)) {
          errors.push(`rule ${ruleId} trigger args must be an object when present`);
        }
      }
    }
  }
  return errors;
}
