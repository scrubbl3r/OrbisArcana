import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { EVENT_RUNTIME_BINDINGS_BY_ID } from "../spell-rules/event-runtime-bindings.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asObj,
  asText,
  isPlainObject,
  normalizeEventId,
  normalizeSpellId,
  pushBooleanEnabledErrorWhenPresent,
  pushUnsupportedKeys,
  requireNonEmptyArray,
  validateOptionalObjectSection,
} from "./orchestrator-v1-normalizers.js";

const ROOT_CONTEXT = "INTERACTIONS_V2";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_WAKE_WIN_CONTEXT = `${DEFAULTS_CONTEXT}.wakeWin`;
const DEFAULTS_EVENT_CONTEXT = `${DEFAULTS_CONTEXT}.event`;
const ROOT_ALLOWED_KEYS = Object.freeze(new Set(["version", "enabled", "defaults", "rules"]));
const DEFAULTS_ALLOWED_KEYS = Object.freeze(new Set(["wakeWin", "event"]));
const RULE_ALLOWED_KEYS = Object.freeze(new Set(["id", "on", "then", "enabled", "priority"]));
const RULE_ON_ALLOWED_KEYS = Object.freeze(new Set(["all"]));
const RULE_CONDITION_ALLOWED_KEYS = Object.freeze(new Set(["type", "id"]));
const WAKE_WIN_ALLOWED_KEYS = Object.freeze(new Set(["type", "spells", "ttlMs", "enabled"]));
const DEFAULTS_WAKE_WIN_ALLOWED_KEYS = Object.freeze(new Set(["ttlMs"]));
const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const SUPPORTED_CONDITION_TYPES = Object.freeze(new Set(["spell", "gesture", "orb_state"]));
const SUPPORTED_ACTION_TYPES = Object.freeze(new Set([ACTION_TYPE_WAKE_WIN, ACTION_TYPE_EVENT]));
const RULE_ID_REQUIRED_ERROR = `${ROOT_CONTEXT}.rules[] entry is missing id`;
const WAKE_WIN_MS_DEPRECATED_SUFFIX = "wake_win should use ttlMs, not ms";

function makeRuleContext(ruleId, section = "") {
  return section ? `rule ${ruleId} ${section}` : `rule ${ruleId}`;
}

function isEntityIdLike(v) {
  return typeof v === "string" && /^[A-Za-z0-9_]+$/.test(v);
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

function pushIdShapeError(errors, idRaw, normalizedId, incompleteMessage, invalidMessage) {
  if (isEntityIdLike(normalizedId)) return false;
  if (isBareNamespaceId(idRaw)) {
    errors.push(incompleteMessage);
  } else {
    errors.push(invalidMessage);
  }
  return true;
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
const UNKNOWN_EVENT_ID_MESSAGE = "references unknown event id";
const MISSING_EVENT_RUNTIME_BINDING_MESSAGE = "references event without runtime binding";

function pushFiniteNonNegativeWhenPresent(errors, context, obj, key) {
  if (!Object.hasOwn(obj, key)) return;
  const n = Number(obj[key]);
  if (!(Number.isFinite(n) && n >= 0)) {
    errors.push(`${context}.${key} must be a finite number >= 0 when present`);
  }
}

function pushEventIdReferenceErrors(
  errors,
  normalizedEventId,
  unknownMessage,
  missingRuntimeBindingMessage = ""
) {
  if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedEventId)) {
    errors.push(unknownMessage);
    return false;
  }
  if (
    missingRuntimeBindingMessage &&
    !Object.hasOwn(EVENT_RUNTIME_BINDINGS_BY_ID, normalizedEventId)
  ) {
    errors.push(missingRuntimeBindingMessage);
  }
  return true;
}

function formatEventIdMessage(context, eventId, reason) {
  return `${context} ${reason}: ${eventId}`;
}

function normalizeConditionId(type, id) {
  if (!id || !type) return "";
  const typePrefix = `${type}.`;
  return id.startsWith(typePrefix) ? id.slice(typePrefix.length) : id;
}

function validateWakeWinSpells(errors, ruleId, action) {
  const wakeWinContext = makeRuleContext(ruleId, "wake_win");
  if (!Array.isArray(action.spells) || !action.spells.length) {
    errors.push(`${wakeWinContext} action requires spells[]`);
    return;
  }
  const seenWakeWinSpells = new Set();
  for (const spellId of action.spells) {
    const id = asText(spellId);
    const normalizedSpellId = normalizeSpellId(id);
    const spellQualifiedPrefix = getQualifiedPrefix(id);
    if (spellQualifiedPrefix && spellQualifiedPrefix !== "spell") {
      errors.push(
        `${wakeWinContext} spell prefix mismatch: ${id} (expected spell.* or unqualified id)`
      );
    }
    if (!isEntityIdLike(id) && !isEntityIdLike(normalizedSpellId)) {
      errors.push(`${wakeWinContext} spell has invalid id shape: ${id}`);
      continue;
    }
    if (!normalizedSpellId) {
      if (isBareNamespaceId(id)) {
        errors.push(`${wakeWinContext} spell id is incomplete: ${id} (missing value after prefix)`);
      } else {
        errors.push(`${wakeWinContext} spell id is empty`);
      }
      continue;
    }
    if (seenWakeWinSpells.has(normalizedSpellId)) {
      errors.push(`${wakeWinContext} contains duplicate spell id: ${id}`);
    }
    seenWakeWinSpells.add(normalizedSpellId);
    if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedSpellId)) {
      errors.push(`${wakeWinContext} references inactive or unknown spell id: ${id}`);
    }
  }
}

function validateRuleConditions(errors, ruleId, onAll) {
  const ruleContext = makeRuleContext(ruleId);
  const conditionContext = makeRuleContext(ruleId, "condition");
  const seenConditions = new Set();
  for (const c of onAll) {
    const cond = asObj(c);
    pushUnsupportedKeys(errors, conditionContext, cond, RULE_CONDITION_ALLOWED_KEYS);
    const type = asText(cond.type).toLowerCase();
    const id = asText(cond.id);
    const normalizedId = normalizeConditionId(type, id);
    if (!type) errors.push(`${ruleContext} has on.all condition missing type`);
    if (!id) errors.push(`${ruleContext} has on.all condition missing id`);
    if (type && !SUPPORTED_CONDITION_TYPES.has(type)) {
      errors.push(`${ruleContext} has unsupported on.all condition type: ${type}`);
    }
    const qualifiedPrefix = getQualifiedPrefix(id);
    if (type && qualifiedPrefix && qualifiedPrefix !== type) {
      errors.push(
        `${ruleContext} condition type/id prefix mismatch: type=${type} id=${id} (expected ${type}.* or unqualified id)`
      );
    }
    if (id && !isEntityIdLike(normalizedId)) {
      if (isBareNamespaceId(id)) {
        errors.push(`${ruleContext} has incomplete on.all id: ${id} (missing value after prefix)`);
      } else {
        errors.push(`${ruleContext} has invalid on.all id shape (use letters/numbers/_): ${id}`);
      }
    }
    const condKey = `${type}:${normalizedId}`;
    if (type && id) {
      if (seenConditions.has(condKey)) {
        errors.push(`${ruleContext} contains duplicate on.all condition: ${type}.${id}`);
      }
      seenConditions.add(condKey);
    }
    const isKnownForType = CONDITION_TYPE_CHECKERS[type];
    if (id && typeof isKnownForType === "function" && !isKnownForType(normalizedId)) {
      errors.push(`${ruleContext} references ${CONDITION_TYPE_UNKNOWN_MESSAGES[type]}: ${id}`);
    }
  }
}

function validateWakeWinAction(errors, ruleId, action) {
  const ruleContext = makeRuleContext(ruleId);
  const wakeWinContext = makeRuleContext(ruleId, "wake_win");
  if (Object.hasOwn(action, "ms")) {
    errors.push(`${ruleContext} ${WAKE_WIN_MS_DEPRECATED_SUFFIX}`);
  }
  pushUnsupportedKeys(
    errors,
    wakeWinContext,
    action,
    WAKE_WIN_ALLOWED_KEYS
  );
  validateWakeWinSpells(errors, ruleId, action);
  pushFiniteNonNegativeWhenPresent(errors, wakeWinContext, action, "ttlMs");
}

function validateEventActionIdAndRefs(errors, ruleContext, action) {
  const eventId = asText(action.id);
  const normalizedEventId = normalizeEventId(eventId);
  const eventQualifiedPrefix = getQualifiedPrefix(eventId);
  if (!eventId) {
    errors.push(`${ruleContext} event action requires id`);
    return;
  }
  if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
    errors.push(
      `${ruleContext} event id prefix mismatch: ${eventId} (expected event.* or unqualified id)`
    );
    return;
  }
  const hasShapeError = pushIdShapeError(
    errors,
    eventId,
    normalizedEventId,
    `${ruleContext} event action id is incomplete: ${eventId} (missing value after prefix)`,
    `${ruleContext} event action has invalid id shape: ${eventId}`
  );
  if (hasShapeError) return;
  pushEventIdReferenceErrors(
    errors,
    normalizedEventId,
    formatEventIdMessage(
      `${ruleContext} event action`,
      eventId,
      UNKNOWN_EVENT_ID_MESSAGE
    ),
    formatEventIdMessage(
      `${ruleContext} event action`,
      eventId,
      MISSING_EVENT_RUNTIME_BINDING_MESSAGE
    )
  );
}

function validateEventActionOverrides(errors, ruleContext, action) {
  if (!Object.hasOwn(action, "overrides")) return;
  const overrides = action.overrides;
  if (!isPlainObject(overrides)) {
    errors.push(`${ruleContext} event action overrides must be an object when present`);
    return;
  }
  for (const key of Object.keys(overrides)) {
    if (!key) errors.push(`${ruleContext} event action overrides contains empty key`);
    if (Object.hasOwn(action, key)) {
      errors.push(`${ruleContext} event action has duplicate key in root and overrides: ${key}`);
    }
  }
}

function validateRuleActions(errors, ruleId, thenActions) {
  const ruleContext = makeRuleContext(ruleId);
  for (const a of thenActions) {
    const action = asObj(a);
    pushBooleanEnabledErrorWhenPresent(errors, ruleContext, action, "action enabled");
    const type = asText(action.type).toLowerCase();
    if (!SUPPORTED_ACTION_TYPES.has(type)) {
      errors.push(`${ruleContext} has unsupported action type: ${type || "(empty)"}`);
      continue;
    }
    if (type === ACTION_TYPE_WAKE_WIN) {
      validateWakeWinAction(errors, ruleId, action);
      continue;
    }
    if (type !== ACTION_TYPE_EVENT) continue;
    validateEventActionIdAndRefs(errors, ruleContext, action);
    validateEventActionOverrides(errors, ruleContext, action);
  }
}

function validateDefaultsEventEntry(errors, seenDefaultEventIds, eventId, eventArgs) {
  const normalizedEventId = normalizeEventId(eventId);
  const eventQualifiedPrefix = getQualifiedPrefix(eventId);
  if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
    errors.push(
      `${DEFAULTS_EVENT_CONTEXT} key prefix mismatch: ${eventId} (expected event.* or unqualified id)`
    );
  } else if (pushIdShapeError(
    errors,
    eventId,
    normalizedEventId,
    `${DEFAULTS_EVENT_CONTEXT} key is incomplete: ${eventId} (missing value after prefix)`,
    `${DEFAULTS_EVENT_CONTEXT} key has invalid id shape: ${eventId}`
  )) {
    // shape error recorded above
  } else {
    const hasKnownDefaultEvent = pushEventIdReferenceErrors(
      errors,
      normalizedEventId,
      formatEventIdMessage(
        DEFAULTS_EVENT_CONTEXT,
        eventId,
        UNKNOWN_EVENT_ID_MESSAGE
      )
    );
    if (hasKnownDefaultEvent) {
      if (seenDefaultEventIds.has(normalizedEventId)) {
        errors.push(`${DEFAULTS_EVENT_CONTEXT} contains duplicate normalized key: ${eventId}`);
      } else {
        seenDefaultEventIds.add(normalizedEventId);
      }
    }
  }
  if (!isPlainObject(eventArgs)) {
    errors.push(`${DEFAULTS_EVENT_CONTEXT}[${eventId}] must be an object`);
  }
}

function validateDefaultsEventEntries(errors, eventDefaults) {
  const seenDefaultEventIds = new Set();
  const eventDefaultEntries = Object.entries(eventDefaults);
  for (const [eventId, eventArgs] of eventDefaultEntries) {
    validateDefaultsEventEntry(errors, seenDefaultEventIds, eventId, eventArgs);
  }
}

function validateInteractionsRoot(errors, cfg) {
  pushUnsupportedKeys(errors, ROOT_CONTEXT, cfg, ROOT_ALLOWED_KEYS);
  if (asText(cfg.version) !== "2") {
    errors.push(`${ROOT_CONTEXT}.version must be "2"`);
  }
  if (typeof cfg.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(cfg.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return false;
  }
  return true;
}

function validateInteractionsDefaults(errors, cfg) {
  validateOptionalObjectSection(cfg, "defaults", (defaults) => {
    pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, DEFAULTS_ALLOWED_KEYS);
    validateOptionalObjectSection(defaults, "wakeWin", (wakeWin) => {
      pushUnsupportedKeys(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWin, DEFAULTS_WAKE_WIN_ALLOWED_KEYS);
      pushFiniteNonNegativeWhenPresent(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWin, "ttlMs");
    });
    validateOptionalObjectSection(defaults, "event", (eventDefaults) => {
      validateDefaultsEventEntries(errors, eventDefaults);
    });
  });
}

function validateInteractionsRules(errors, cfg) {
  const ids = new Set();
  for (const rawRule of cfg.rules) validateRuleEntry(errors, ids, rawRule);
}

function validateRuleEntry(errors, ids, ruleRaw) {
  const r = asObj(ruleRaw);
  const ruleId = asText(r.id);
  if (!ruleId) {
    errors.push(RULE_ID_REQUIRED_ERROR);
    return;
  }
  const ruleContext = makeRuleContext(ruleId);
  if (ids.has(ruleId)) {
    errors.push(`INTERACTIONS_V2.rules contains duplicate id: ${ruleId}`);
  }
  ids.add(ruleId);
  pushUnsupportedKeys(errors, ruleContext, r, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, r);
  const rulePriorityNum = Number(r.priority);
  if (Object.hasOwn(r, "priority") && !Number.isFinite(rulePriorityNum)) {
    errors.push(`${ruleContext} priority must be a finite number when present`);
  }
  const on = asObj(r.on);
  const onAll = on.all;
  const onContext = makeRuleContext(ruleId, "on");
  pushUnsupportedKeys(errors, onContext, on, RULE_ON_ALLOWED_KEYS);
  if (requireNonEmptyArray(errors, onAll, `${ruleContext} must define on.all[]`)) {
    validateRuleConditions(errors, ruleId, onAll);
  }
  const thenActionsRequiredError = `${ruleContext} must define then[] actions`;
  if (requireNonEmptyArray(errors, r.then, thenActionsRequiredError)) {
    validateRuleActions(errors, ruleId, r.then);
  }
}

export function validateInteractionsV2(input = INTERACTIONS_V2) {
  const errors = [];
  const cfg = asObj(input);
  if (!validateInteractionsRoot(errors, cfg)) {
    return { ok: false, errors };
  }
  validateInteractionsDefaults(errors, cfg);
  validateInteractionsRules(errors, cfg);

  return { ok: errors.length === 0, errors };
}
