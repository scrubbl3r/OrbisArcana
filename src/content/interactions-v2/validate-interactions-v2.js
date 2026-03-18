import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { EVENT_RUNTIME_BINDINGS_BY_ID } from "../spell-rules/event-runtime-bindings.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asObj,
  asText,
  hasNonEmptyArray,
  isPlainObject,
  normalizeEventId,
  normalizeSpellId,
  pushUnsupportedKeys,
  requireNonEmptyArray,
} from "./orchestrator-v1-normalizers.js";

const WAKE_WIN_ALLOWED_KEYS = Object.freeze(new Set(["type", "spells", "ttlMs", "enabled"]));
const ROOT_ALLOWED_KEYS = Object.freeze(new Set(["version", "enabled", "defaults", "rules"]));
const DEFAULTS_ALLOWED_KEYS = Object.freeze(new Set(["wakeWin", "event"]));
const DEFAULTS_WAKE_WIN_ALLOWED_KEYS = Object.freeze(new Set(["ttlMs"]));
const RULE_ALLOWED_KEYS = Object.freeze(new Set(["id", "on", "then", "enabled", "priority"]));
const RULE_ON_ALLOWED_KEYS = Object.freeze(new Set(["all"]));
const RULE_CONDITION_ALLOWED_KEYS = Object.freeze(new Set(["type", "id"]));
const RULE_ACTION_TYPES = Object.freeze(new Set(["wake_win", "event"]));

function isFiniteNonNegative(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

function isEntityIdLike(v) {
  return typeof v === "string" && /^[A-Za-z0-9_]+$/.test(v);
}

function normalizeConditionId(type, idRaw) {
  const id = asText(idRaw).toLowerCase();
  const t = asText(type).toLowerCase();
  if (!id || !t) return "";
  const pref = `${t}.`;
  return id.startsWith(pref) ? id.slice(pref.length) : id;
}

function getQualifiedPrefix(idRaw) {
  const id = asText(idRaw).toLowerCase();
  const dot = id.indexOf(".");
  if (dot <= 0) return "";
  return id.slice(0, dot);
}

function isBareNamespaceId(idRaw) {
  return /^[a-z_]+\.$/.test(asText(idRaw).toLowerCase());
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
const CONDITION_TYPE_CHECKERS = Object.freeze({
  spell: (id) => Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id),
  gesture: (id) => KNOWN_GESTURE_IDS.has(id),
  orb_state: (id) => KNOWN_ORB_STATE_IDS.has(id),
});
const CONDITION_TYPE_UNKNOWN_MESSAGES = Object.freeze({
  spell: "inactive or unknown spell id",
  gesture: "unknown gesture id",
  orb_state: "unknown orb_state id",
});

function validateOptionalObjectSection(source, key, validateSectionFn) {
  if (!Object.hasOwn(source, key)) return;
  validateSectionFn(asObj(source[key]));
}

function pushFiniteNonNegativeWhenPresent(errors, context, obj, key) {
  if (!Object.hasOwn(obj, key)) return;
  if (!isFiniteNonNegative(obj[key])) {
    errors.push(`${context}.${key} must be a finite number >= 0 when present`);
  }
}

function pushBooleanEnabledErrorWhenPresent(errors, context, source, label = "enabled") {
  if (Object.hasOwn(source, "enabled") && typeof source.enabled !== "boolean") {
    errors.push(`${context} ${label} must be boolean when present`);
  }
}

function validateWakeWinSpells(errors, ruleId, action) {
  if (!Array.isArray(action.spells) || !action.spells.length) {
    errors.push(`rule ${ruleId} wake_win action requires spells[]`);
    return;
  }
  const seenWakeWinSpells = new Set();
  for (const spellId of action.spells) {
    const id = asText(spellId);
    const normalizedSpellId = normalizeSpellId(id);
    const spellQualifiedPrefix = getQualifiedPrefix(id);
    if (spellQualifiedPrefix && spellQualifiedPrefix !== "spell") {
      errors.push(
        `rule ${ruleId} wake_win spell prefix mismatch: ${id} (expected spell.* or unqualified id)`
      );
    }
    if (!isEntityIdLike(id) && !isEntityIdLike(normalizedSpellId)) {
      errors.push(`rule ${ruleId} wake_win spell has invalid id shape: ${id}`);
      continue;
    }
    if (!normalizedSpellId) {
      if (isBareNamespaceId(id)) {
        errors.push(`rule ${ruleId} wake_win spell id is incomplete: ${id} (missing value after prefix)`);
      } else {
        errors.push(`rule ${ruleId} wake_win spell id is empty`);
      }
      continue;
    }
    if (seenWakeWinSpells.has(normalizedSpellId)) {
      errors.push(`rule ${ruleId} wake_win contains duplicate spell id: ${id}`);
    }
    seenWakeWinSpells.add(normalizedSpellId);
    if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedSpellId)) {
      errors.push(`rule ${ruleId} wake_win references inactive or unknown spell id: ${id}`);
    }
  }
}

function validateEventActionId(errors, ruleId, action) {
  const eventId = asText(action.id);
  const normalizedEventId = normalizeEventId(eventId);
  const eventQualifiedPrefix = getQualifiedPrefix(eventId);
  if (!eventId) {
    errors.push(`rule ${ruleId} event action requires id`);
  } else if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
    errors.push(
      `rule ${ruleId} event id prefix mismatch: ${eventId} (expected event.* or unqualified id)`
    );
  } else if (!isEntityIdLike(normalizedEventId)) {
    if (isBareNamespaceId(eventId)) {
      errors.push(`rule ${ruleId} event action id is incomplete: ${eventId} (missing value after prefix)`);
    } else {
      errors.push(`rule ${ruleId} event action has invalid id shape: ${eventId}`);
    }
  } else if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedEventId)) {
    errors.push(`rule ${ruleId} event action references unknown event id: ${eventId}`);
  } else if (!Object.hasOwn(EVENT_RUNTIME_BINDINGS_BY_ID, normalizedEventId)) {
    errors.push(`rule ${ruleId} event action references event without runtime binding: ${eventId}`);
  }
}

function validateEventActionOverrides(errors, ruleId, action) {
  if (!Object.hasOwn(action, "overrides")) return;
  const overrides = action.overrides;
  if (!isPlainObject(overrides)) {
    errors.push(`rule ${ruleId} event action overrides must be an object when present`);
    return;
  }
  for (const key of Object.keys(overrides)) {
    if (!key) errors.push(`rule ${ruleId} event action overrides contains empty key`);
    if (Object.hasOwn(action, key)) {
      errors.push(`rule ${ruleId} event action has duplicate key in root and overrides: ${key}`);
    }
  }
}

function validateDefaultsWakeWin(errors, defaults) {
  validateOptionalObjectSection(defaults, "wakeWin", (wakeWin) => {
    const wakeWinContext = "INTERACTIONS_V2.defaults.wakeWin";
    pushUnsupportedKeys(errors, wakeWinContext, wakeWin, DEFAULTS_WAKE_WIN_ALLOWED_KEYS);
    pushFiniteNonNegativeWhenPresent(errors, wakeWinContext, wakeWin, "ttlMs");
  });
}

function validateDefaultsEventEntry(errors, seenDefaultEventIds, eventId, eventArgs) {
  const normalizedEventId = normalizeEventId(eventId);
  const eventQualifiedPrefix = getQualifiedPrefix(eventId);
  if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
    errors.push(
      `INTERACTIONS_V2.defaults.event key prefix mismatch: ${eventId} (expected event.* or unqualified id)`
    );
  } else if (!isEntityIdLike(normalizedEventId)) {
    if (isBareNamespaceId(eventId)) {
      errors.push(`INTERACTIONS_V2.defaults.event key is incomplete: ${eventId} (missing value after prefix)`);
    } else {
      errors.push(`INTERACTIONS_V2.defaults.event key has invalid id shape: ${eventId}`);
    }
  } else if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedEventId)) {
    errors.push(`INTERACTIONS_V2.defaults.event references unknown event id: ${eventId}`);
  } else if (seenDefaultEventIds.has(normalizedEventId)) {
    errors.push(`INTERACTIONS_V2.defaults.event contains duplicate normalized key: ${eventId}`);
  } else {
    seenDefaultEventIds.add(normalizedEventId);
  }
  if (!isPlainObject(eventArgs)) {
    errors.push(`INTERACTIONS_V2.defaults.event[${eventId}] must be an object`);
  }
}

function validateDefaultsEvent(errors, defaults) {
  validateOptionalObjectSection(defaults, "event", (eventDefaults) => {
    const seenDefaultEventIds = new Set();
    for (const [eventId, eventArgs] of Object.entries(eventDefaults)) {
      validateDefaultsEventEntry(errors, seenDefaultEventIds, eventId, eventArgs);
    }
  });
}

function validateRuleConditionCore(errors, ruleId, cond) {
  pushUnsupportedKeys(errors, `rule ${ruleId} condition`, cond, RULE_CONDITION_ALLOWED_KEYS);
  const type = asText(cond.type).toLowerCase();
  const id = asText(cond.id);
  const normalizedId = normalizeConditionId(type, id);
  if (!type) errors.push(`rule ${ruleId} has on.all condition missing type`);
  if (!id) errors.push(`rule ${ruleId} has on.all condition missing id`);
  if (type && type !== "spell" && type !== "gesture" && type !== "orb_state") {
    errors.push(`rule ${ruleId} has unsupported on.all condition type: ${type}`);
  }
  const qualifiedPrefix = getQualifiedPrefix(id);
  if (type && qualifiedPrefix && qualifiedPrefix !== type) {
    errors.push(
      `rule ${ruleId} condition type/id prefix mismatch: type=${type} id=${id} (expected ${type}.* or unqualified id)`
    );
  }
  if (id && !isEntityIdLike(normalizedId)) {
    if (isBareNamespaceId(id)) {
      errors.push(`rule ${ruleId} has incomplete on.all id: ${id} (missing value after prefix)`);
    } else {
      errors.push(`rule ${ruleId} has invalid on.all id shape (use letters/numbers/_): ${id}`);
    }
  }
  return { type, id, normalizedId };
}

function validateRuleConditions(errors, ruleId, onAll) {
  const seenConditions = new Set();
  for (const c of onAll) {
    const cond = asObj(c);
    const { type, id, normalizedId } = validateRuleConditionCore(errors, ruleId, cond);
    const condKey = `${type}:${normalizedId}`;
    if (type && id) {
      if (seenConditions.has(condKey)) {
        errors.push(`rule ${ruleId} contains duplicate on.all condition: ${type}.${id}`);
      }
      seenConditions.add(condKey);
    }
    const isKnownForType = CONDITION_TYPE_CHECKERS[type];
    if (id && typeof isKnownForType === "function" && !isKnownForType(normalizedId)) {
      errors.push(`rule ${ruleId} references ${CONDITION_TYPE_UNKNOWN_MESSAGES[type]}: ${id}`);
    }
  }
}

function getValidatedActionType(errors, ruleId, action) {
  pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId}`, action, "action enabled");
  const type = asText(action.type).toLowerCase();
  if (!RULE_ACTION_TYPES.has(type)) {
    errors.push(`rule ${ruleId} has unsupported action type: ${type || "(empty)"}`);
    return "";
  }
  return type;
}

function validateWakeWinAction(errors, ruleId, action) {
  if (Object.hasOwn(action, "ms")) {
    errors.push(`rule ${ruleId} wake_win should use ttlMs, not ms`);
  }
  const wakeWinContext = `rule ${ruleId} wake_win`;
  pushUnsupportedKeys(errors, wakeWinContext, action, WAKE_WIN_ALLOWED_KEYS);
  validateWakeWinSpells(errors, ruleId, action);
  pushFiniteNonNegativeWhenPresent(errors, wakeWinContext, action, "ttlMs");
}

function validateEventAction(errors, ruleId, action) {
  validateEventActionId(errors, ruleId, action);
  validateEventActionOverrides(errors, ruleId, action);
}

const ACTION_VALIDATORS_BY_TYPE = Object.freeze({
  wake_win: validateWakeWinAction,
  event: validateEventAction,
});

function validateRuleActions(errors, ruleId, thenActions) {
  for (const a of thenActions) {
    const action = asObj(a);
    const type = getValidatedActionType(errors, ruleId, action);
    if (!type) continue;
    ACTION_VALIDATORS_BY_TYPE[type](errors, ruleId, action);
  }
}

function registerRuleId(errors, ids, ruleRaw) {
  const rule = asObj(ruleRaw);
  const ruleId = asText(rule.id);
  if (!ruleId) {
    errors.push("INTERACTIONS_V2.rules[] entry is missing id");
    return null;
  }
  if (ids.has(ruleId)) {
    errors.push(`INTERACTIONS_V2.rules contains duplicate id: ${ruleId}`);
  }
  ids.add(ruleId);
  return { rule, ruleId };
}

function validateRulePriority(errors, ruleId, rule) {
  const rulePriorityNum = Number(rule.priority);
  if (Object.hasOwn(rule, "priority") && !Number.isFinite(rulePriorityNum)) {
    errors.push(`rule ${ruleId} priority must be a finite number when present`);
  }
}

function validateRuleOnSection(errors, ruleId, rule) {
  const on = asObj(rule.on);
  pushUnsupportedKeys(errors, `rule ${ruleId} on`, on, RULE_ON_ALLOWED_KEYS);
  if (!requireNonEmptyArray(errors, on.all, `rule ${ruleId} must define on.all[]`)) return;
  validateRuleConditions(errors, ruleId, on.all);
}

function validateRuleThenSection(errors, ruleId, rule) {
  if (!requireNonEmptyArray(errors, rule.then, `rule ${ruleId} must define then[] actions`)) return;
  validateRuleActions(errors, ruleId, rule.then);
}

function validateRootShape(errors, cfg) {
  pushUnsupportedKeys(errors, "INTERACTIONS_V2", cfg, ROOT_ALLOWED_KEYS);
  if (asText(cfg.version) !== "2") {
    errors.push("INTERACTIONS_V2.version must be \"2\"");
  }
  if (typeof cfg.enabled !== "boolean") {
    errors.push("INTERACTIONS_V2.enabled must be boolean");
  }
  if (!Array.isArray(cfg.rules)) {
    errors.push("INTERACTIONS_V2.rules must be an array");
    return false;
  }
  return true;
}

function validateDefaultsCore(errors, defaults) {
  pushUnsupportedKeys(errors, "INTERACTIONS_V2.defaults", defaults, DEFAULTS_ALLOWED_KEYS);
  validateDefaultsWakeWin(errors, defaults);
  validateDefaultsEvent(errors, defaults);
}

function validateDefaultsSection(errors, cfg) {
  validateOptionalObjectSection(cfg, "defaults", (defaults) => {
    validateDefaultsCore(errors, defaults);
  });
}

function validateRuleCore(errors, ruleId, rule) {
  pushUnsupportedKeys(errors, `rule ${ruleId}`, rule, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, `rule ${ruleId}`, rule);
  validateRulePriority(errors, ruleId, rule);
}

function validateRuleEntry(errors, ids, ruleRaw) {
  const resolved = registerRuleId(errors, ids, ruleRaw);
  if (!resolved) return;
  const { rule: r, ruleId } = resolved;
  validateRuleCore(errors, ruleId, r);
  validateRuleOnSection(errors, ruleId, r);
  validateRuleThenSection(errors, ruleId, r);
}

export function validateInteractionsV2(input = INTERACTIONS_V2) {
  const errors = [];
  const cfg = asObj(input);
  if (!validateRootShape(errors, cfg)) return { ok: false, errors };
  validateDefaultsSection(errors, cfg);

  const ids = new Set();
  for (const rule of cfg.rules) validateRuleEntry(errors, ids, rule);

  return { ok: errors.length === 0, errors };
}
