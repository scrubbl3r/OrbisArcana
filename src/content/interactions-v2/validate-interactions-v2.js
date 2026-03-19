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
const INTERACTIONS_VERSION = "2";
const TYPE_BOOLEAN = "boolean";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_WAKE_WIN_CONTEXT = `${DEFAULTS_CONTEXT}.wakeWin`;
const DEFAULTS_EVENT_CONTEXT = `${DEFAULTS_CONTEXT}.event`;
const FIELD_VERSION = "version";
const FIELD_ENABLED = "enabled";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const DEFAULTS_KEY_WAKE_WIN = "wakeWin";
const DEFAULTS_KEY_EVENT = "event";
const RULE_SECTION_ON = "on";
const RULE_SECTION_CONDITION = "condition";
const RULE_SECTION_WAKE_WIN = "wake_win";
const CONDITION_TYPE_SPELL = "spell";
const CONDITION_TYPE_GESTURE = "gesture";
const CONDITION_TYPE_ORB_STATE = "orb_state";
const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const FIELD_ID = "id";
const FIELD_TYPE = "type";
const FIELD_SPELLS = "spells";
const FIELD_TTL_MS = "ttlMs";
const FIELD_PRIORITY = "priority";
const FIELD_ON = "on";
const FIELD_ALL = "all";
const FIELD_THEN = "then";
const FIELD_OVERRIDES = "overrides";
const FIELD_MS = "ms";
const LABEL_ON_ALL = "on.all";
const LABEL_EVENT_ACTION = "event action";
const ERR_REF_UNKNOWN_OR_INACTIVE_SPELL = "references inactive or unknown spell id";
const ERR_REF_UNKNOWN_GESTURE = "references unknown gesture id";
const ERR_REF_UNKNOWN_ORB_STATE = "references unknown orb_state id";
const SUPPORTED_CONDITION_TYPES = Object.freeze([
  CONDITION_TYPE_SPELL,
  CONDITION_TYPE_GESTURE,
  CONDITION_TYPE_ORB_STATE,
]);
const SUPPORTED_ACTION_TYPES = Object.freeze([ACTION_TYPE_WAKE_WIN, ACTION_TYPE_EVENT]);
const ENTITY_ID_RE = /^[A-Za-z0-9_]+$/;
const BARE_NAMESPACE_RE = /^[a-z_]+\.$/;
const SIGNAL_PREFIX_GESTURE = "gesture.";
const SIGNAL_PREFIX_ORB_STATE = "orb_state.";
const ROOT_ALLOWED_KEYS = new Set([FIELD_VERSION, FIELD_ENABLED, FIELD_DEFAULTS, FIELD_RULES]);
const RULE_ALLOWED_KEYS = new Set([FIELD_ID, FIELD_ON, FIELD_THEN, FIELD_ENABLED, FIELD_PRIORITY]);
const RULE_ON_ALLOWED_KEYS = new Set([FIELD_ALL]);
const RULE_CONDITION_ALLOWED_KEYS = new Set([FIELD_TYPE, FIELD_ID]);
const WAKE_WIN_ALLOWED_KEYS = new Set([FIELD_TYPE, FIELD_SPELLS, FIELD_TTL_MS, FIELD_ENABLED]);
const DEFAULTS_ALLOWED_KEYS = new Set([DEFAULTS_KEY_WAKE_WIN, DEFAULTS_KEY_EVENT]);
const DEFAULTS_WAKE_WIN_ALLOWED_KEYS = new Set([FIELD_TTL_MS]);

function makeRuleContext(ruleId, section = "") {
  return section ? `rule ${ruleId} ${section}` : `rule ${ruleId}`;
}

function getRuleEntries(cfg) {
  return Array.isArray(cfg?.[FIELD_RULES]) ? cfg[FIELD_RULES] : [];
}

function isEntityIdLike(v) {
  return typeof v === "string" && ENTITY_ID_RE.test(v);
}

function getQualifiedPrefix(idRaw) {
  const id = asText(idRaw).toLowerCase();
  const dotIndex = id.indexOf(".");
  if (dotIndex <= 0) return "";
  return id.slice(0, dotIndex);
}

function isBareNamespaceId(idRaw) {
  return BARE_NAMESPACE_RE.test(asText(idRaw).toLowerCase());
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

function collectKnownSignalIds(prefix) {
  return new Set(
    Object.keys((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
      ? SIGNAL_DEFINITIONS_BY_ID
      : {})
      .filter((signalId) => typeof signalId === "string" && signalId.startsWith(prefix))
      .map((signalId) => signalId.slice(prefix.length))
      .filter(Boolean)
  );
}

const isKnownGestureId = (() => {
  const knownIds = collectKnownSignalIds(SIGNAL_PREFIX_GESTURE);
  return (id) => knownIds.has(id);
})();
const isKnownOrbStateId = (() => {
  const knownIds = collectKnownSignalIds(SIGNAL_PREFIX_ORB_STATE);
  return (id) => knownIds.has(id);
})();

function collectRuleOnAllConditions(errors, rule, onContext) {
  const on = asObj(rule[FIELD_ON]);
  pushUnsupportedKeys(errors, onContext, on, RULE_ON_ALLOWED_KEYS);
  return on[FIELD_ALL];
}

function pushConditionReferenceErrors(errors, ruleContext, type, normalizedId, id) {
  if (type === CONDITION_TYPE_SPELL && !Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedId)) {
    errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_OR_INACTIVE_SPELL}: ${id}`);
  } else if (type === CONDITION_TYPE_GESTURE && !isKnownGestureId(normalizedId)) {
    errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_GESTURE}: ${id}`);
  } else if (type === CONDITION_TYPE_ORB_STATE && !isKnownOrbStateId(normalizedId)) {
    errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_ORB_STATE}: ${id}`);
  }
}

function pushFiniteNonNegativeWhenPresent(errors, context, obj, key) {
  if (!Object.hasOwn(obj, key)) return;
  const numericValue = Number(obj[key]);
  if (!(Number.isFinite(numericValue) && numericValue >= 0)) {
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

function pushDuplicateWhenSeen(errors, seenValues, value, message) {
  if (seenValues.has(value)) {
    errors.push(message);
    return true;
  }
  seenValues.add(value);
  return false;
}

function validateWakeWinAction(errors, ruleContext, ruleId, action) {
  const wakeWinContext = makeRuleContext(ruleId, RULE_SECTION_WAKE_WIN);
  if (Object.hasOwn(action, FIELD_MS)) {
    errors.push(`${ruleContext} wake_win should use ttlMs, not ms`);
  }
  pushUnsupportedKeys(
    errors,
    wakeWinContext,
    action,
    WAKE_WIN_ALLOWED_KEYS
  );
  if (!Array.isArray(action[FIELD_SPELLS]) || !action[FIELD_SPELLS].length) {
    errors.push(`${wakeWinContext} action requires spells[]`);
  } else {
    const seenWakeWinSpells = new Set();
    for (const spellId of action[FIELD_SPELLS]) {
      const id = asText(spellId);
      const normalizedSpellId = normalizeSpellId(id);
      const spellQualifiedPrefix = getQualifiedPrefix(id);
      if (spellQualifiedPrefix && spellQualifiedPrefix !== CONDITION_TYPE_SPELL) {
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
          errors.push(
            `${wakeWinContext} spell id is incomplete: ${id} (missing value after prefix)`
          );
        } else {
          errors.push(`${wakeWinContext} spell id is empty`);
        }
        continue;
      }
      pushDuplicateWhenSeen(
        errors,
        seenWakeWinSpells,
        normalizedSpellId,
        `${wakeWinContext} contains duplicate spell id: ${id}`
      );
      if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedSpellId)) {
        errors.push(`${wakeWinContext} ${ERR_REF_UNKNOWN_OR_INACTIVE_SPELL}: ${id}`);
      }
    }
  }
  pushFiniteNonNegativeWhenPresent(errors, wakeWinContext, action, FIELD_TTL_MS);
}

function validateEventAction(errors, ruleContext, action) {
  const eventId = asText(action[FIELD_ID]);
  const normalizedEventId = normalizeEventId(eventId);
  const eventActionContext = `${ruleContext} ${LABEL_EVENT_ACTION}`;
  if (!eventId) {
    errors.push(`${eventActionContext} requires id`);
    return;
  }
  const eventQualifiedPrefix = getQualifiedPrefix(eventId);
  if (eventQualifiedPrefix && eventQualifiedPrefix !== ACTION_TYPE_EVENT) {
    errors.push(
      `${ruleContext} event id prefix mismatch: ${eventId} (expected event.* or unqualified id)`
    );
    return;
  }
  if (!pushIdShapeError(
    errors,
    eventId,
    normalizedEventId,
    `${eventActionContext} id is incomplete: ${eventId} (missing value after prefix)`,
    `${eventActionContext} has invalid id shape: ${eventId}`
  )) {
    pushEventIdReferenceErrors(
      errors,
      normalizedEventId,
      `${eventActionContext} references unknown event id: ${eventId}`,
      `${eventActionContext} references event without runtime binding: ${eventId}`
    );
  }
  if (!Object.hasOwn(action, FIELD_OVERRIDES)) return;
  if (!isPlainObject(action[FIELD_OVERRIDES])) {
    errors.push(`${eventActionContext} overrides must be an object when present`);
    return;
  }
  for (const key of Object.keys(action[FIELD_OVERRIDES])) {
    if (!key) errors.push(`${eventActionContext} overrides contains empty key`);
    if (Object.hasOwn(action, key)) {
      errors.push(`${eventActionContext} has duplicate key in root and overrides: ${key}`);
    }
  }
}

function validateRuleThenActions(errors, ruleContext, ruleId, thenActions) {
  if (!requireNonEmptyArray(errors, thenActions, `${ruleContext} must define then[] actions`)) {
    return;
  }
  for (const actionRaw of thenActions) {
    const action = asObj(actionRaw);
    pushBooleanEnabledErrorWhenPresent(errors, ruleContext, action, "action enabled");
    const type = asText(action[FIELD_TYPE]).toLowerCase();
    if (!SUPPORTED_ACTION_TYPES.includes(type)) {
      errors.push(`${ruleContext} has unsupported action type: ${type || "(empty)"}`);
      continue;
    }
    if (type === ACTION_TYPE_WAKE_WIN) {
      validateWakeWinAction(errors, ruleContext, ruleId, action);
      continue;
    }
    validateEventAction(errors, ruleContext, action);
  }
}

function resolveRuleIdForValidation(errors, ids, rule) {
  const ruleId = asText(rule[FIELD_ID]);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return "";
  }
  pushDuplicateWhenSeen(
    errors,
    ids,
    ruleId,
    `${ROOT_CONTEXT}.rules contains duplicate id: ${ruleId}`
  );
  return ruleId;
}

function validateRuleOnAllConditions(errors, ruleContext, ruleId, onAllConditions) {
  if (!requireNonEmptyArray(errors, onAllConditions, `${ruleContext} must define ${LABEL_ON_ALL}[]`)) {
    return;
  }
  const conditionContext = makeRuleContext(ruleId, RULE_SECTION_CONDITION);
  const seenConditions = new Set();
  for (const conditionRaw of onAllConditions) {
    const cond = asObj(conditionRaw);
    pushUnsupportedKeys(errors, conditionContext, cond, RULE_CONDITION_ALLOWED_KEYS);
    const type = asText(cond[FIELD_TYPE]).toLowerCase();
    const id = asText(cond[FIELD_ID]);
    const normalizedId = (!id || !type)
      ? ""
      : (id.startsWith(`${type}.`) ? id.slice(`${type}.`.length) : id);
    if (!type) errors.push(`${ruleContext} has ${LABEL_ON_ALL} condition missing type`);
    if (!id) errors.push(`${ruleContext} has ${LABEL_ON_ALL} condition missing id`);
    if (type && !SUPPORTED_CONDITION_TYPES.includes(type)) {
      errors.push(`${ruleContext} has unsupported ${LABEL_ON_ALL} condition type: ${type}`);
    }
    const qualifiedPrefix = getQualifiedPrefix(id);
    if (type && qualifiedPrefix && qualifiedPrefix !== type) {
      errors.push(
        `${ruleContext} condition type/id prefix mismatch: type=${type} id=${id} (expected ${type}.* or unqualified id)`
      );
    }
    if (id && !isEntityIdLike(normalizedId)) {
      if (isBareNamespaceId(id)) {
        errors.push(`${ruleContext} has incomplete ${LABEL_ON_ALL} id: ${id} (missing value after prefix)`);
      } else {
        errors.push(`${ruleContext} has invalid ${LABEL_ON_ALL} id shape (use letters/numbers/_): ${id}`);
      }
    }
    if (type && id) {
      pushDuplicateWhenSeen(
        errors,
        seenConditions,
        `${type}:${normalizedId}`,
        `${ruleContext} contains duplicate ${LABEL_ON_ALL} condition: ${type}.${id}`
      );
    }
    if (id && type) {
      pushConditionReferenceErrors(errors, ruleContext, type, normalizedId, id);
    }
  }
}

function validateRuleEntry(errors, ids, ruleRaw) {
  const r = asObj(ruleRaw);
  const ruleId = resolveRuleIdForValidation(errors, ids, r);
  if (!ruleId) return;
  const ruleContext = makeRuleContext(ruleId);
  pushUnsupportedKeys(errors, ruleContext, r, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, r);
  if (Object.hasOwn(r, FIELD_PRIORITY) && !Number.isFinite(Number(r[FIELD_PRIORITY]))) {
    errors.push(`${ruleContext} priority must be a finite number when present`);
  }
  const onContext = makeRuleContext(ruleId, RULE_SECTION_ON);
  const onAllConditions = collectRuleOnAllConditions(errors, r, onContext);
  validateRuleOnAllConditions(errors, ruleContext, ruleId, onAllConditions);
  validateRuleThenActions(errors, ruleContext, ruleId, r[FIELD_THEN]);
}

function validateInteractionsRoot(errors, cfg) {
  pushUnsupportedKeys(errors, ROOT_CONTEXT, cfg, ROOT_ALLOWED_KEYS);
  if (asText(cfg[FIELD_VERSION]) !== INTERACTIONS_VERSION) {
    errors.push(`${ROOT_CONTEXT}.version must be "${INTERACTIONS_VERSION}"`);
  }
  if (typeof cfg[FIELD_ENABLED] !== TYPE_BOOLEAN) {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (getRuleEntries(cfg).length || Array.isArray(cfg[FIELD_RULES])) return true;
  errors.push(`${ROOT_CONTEXT}.rules must be an array`);
  return false;
}

function validateDefaultsEventEntry(errors, seenDefaultEventIds, eventId, eventArgs) {
  const normalizedEventId = normalizeEventId(eventId);
  const eventDefaultPrefix = getQualifiedPrefix(eventId);
  if (eventDefaultPrefix && eventDefaultPrefix !== ACTION_TYPE_EVENT) {
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
    if (pushEventIdReferenceErrors(
      errors,
      normalizedEventId,
      `${DEFAULTS_EVENT_CONTEXT} references unknown event id: ${eventId}`
    )) {
      pushDuplicateWhenSeen(
        errors,
        seenDefaultEventIds,
        normalizedEventId,
        `${DEFAULTS_EVENT_CONTEXT} contains duplicate normalized key: ${eventId}`
      );
    }
  }
  if (!isPlainObject(eventArgs)) {
    errors.push(`${DEFAULTS_EVENT_CONTEXT}[${eventId}] must be an object`);
  }
}

function validateDefaultsWakeWinSection(errors, wakeWin) {
  pushUnsupportedKeys(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWin, DEFAULTS_WAKE_WIN_ALLOWED_KEYS);
  pushFiniteNonNegativeWhenPresent(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWin, FIELD_TTL_MS);
}

function validateDefaultsEventSection(errors, eventDefaults) {
  const seenDefaultEventIds = new Set();
  for (const [eventId, eventArgs] of Object.entries(eventDefaults)) {
    validateDefaultsEventEntry(errors, seenDefaultEventIds, eventId, eventArgs);
  }
}

function validateDefaultsSections(errors, defaults) {
  pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, DEFAULTS_ALLOWED_KEYS);
  validateOptionalObjectSection(defaults, DEFAULTS_KEY_WAKE_WIN, (wakeWin) =>
    validateDefaultsWakeWinSection(errors, wakeWin)
  );
  validateOptionalObjectSection(defaults, DEFAULTS_KEY_EVENT, (eventDefaults) =>
    validateDefaultsEventSection(errors, eventDefaults)
  );
}

function validateRuleEntries(errors, cfg) {
  const ids = new Set();
  for (const rawRule of getRuleEntries(cfg)) {
    validateRuleEntry(errors, ids, rawRule);
  }
}

export function validateInteractionsV2(input = INTERACTIONS_V2) {
  const errors = [];
  const cfg = asObj(input);
  if (!validateInteractionsRoot(errors, cfg)) {
    return { ok: false, errors };
  }
  validateOptionalObjectSection(cfg, FIELD_DEFAULTS, (defaults) =>
    validateDefaultsSections(errors, defaults)
  );
  validateRuleEntries(errors, cfg);

  return { ok: errors.length === 0, errors };
}
