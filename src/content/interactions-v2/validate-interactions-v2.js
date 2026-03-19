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
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_WAKE_WIN_CONTEXT = `${DEFAULTS_CONTEXT}.wakeWin`;
const DEFAULTS_EVENT_CONTEXT = `${DEFAULTS_CONTEXT}.event`;
const FIELD_SPELLS = "spells";
const FIELD_TTL_MS = "ttlMs";
const LABEL_ON_ALL = "on.all";
const ERR_REF_UNKNOWN_OR_INACTIVE_SPELL = "references inactive or unknown spell id";
const ERR_REF_UNKNOWN_GESTURE = "references unknown gesture id";
const ERR_REF_UNKNOWN_ORB_STATE = "references unknown orb_state id";
const SUPPORTED_CONDITION_TYPES = Object.freeze([
  "spell",
  "gesture",
  "orb_state",
]);
const ENTITY_ID_RE = /^[A-Za-z0-9_]+$/;
const BARE_NAMESPACE_RE = /^[a-z_]+\.$/;
const SIGNAL_PREFIX_GESTURE = "gesture.";
const SIGNAL_PREFIX_ORB_STATE = "orb_state.";
const ROOT_ALLOWED_KEYS = new Set(["version", "enabled", "defaults", "rules"]);
const RULE_ALLOWED_KEYS = new Set(["id", "on", "then", "enabled", "priority"]);
const RULE_CONDITION_ALLOWED_KEYS = new Set(["type", "id"]);
const WAKE_WIN_ALLOWED_KEYS = new Set(["type", FIELD_SPELLS, FIELD_TTL_MS, "enabled"]);
const DEFAULTS_ALLOWED_KEYS = new Set(["wakeWin", "event"]);

function makeRuleContext(ruleId, section = "") {
  return section ? `rule ${ruleId} ${section}` : `rule ${ruleId}`;
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

const knownGestureIds = new Set(
  Object.keys((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
    ? SIGNAL_DEFINITIONS_BY_ID
    : {})
    .filter((signalId) => typeof signalId === "string" && signalId.startsWith(SIGNAL_PREFIX_GESTURE))
    .map((signalId) => signalId.slice(SIGNAL_PREFIX_GESTURE.length))
    .filter(Boolean)
);
const knownOrbStateIds = new Set(
  Object.keys((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
    ? SIGNAL_DEFINITIONS_BY_ID
    : {})
    .filter((signalId) => typeof signalId === "string" && signalId.startsWith(SIGNAL_PREFIX_ORB_STATE))
    .map((signalId) => signalId.slice(SIGNAL_PREFIX_ORB_STATE.length))
    .filter(Boolean)
);

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

function validateRuleEntry(errors, ids, ruleRaw) {
  const r = asObj(ruleRaw);
  const ruleId = asText(r.id);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return;
  }
  pushDuplicateWhenSeen(
    errors,
    ids,
    ruleId,
    `${ROOT_CONTEXT}.rules contains duplicate id: ${ruleId}`
  );
  const ruleContext = makeRuleContext(ruleId);
  pushUnsupportedKeys(errors, ruleContext, r, RULE_ALLOWED_KEYS);
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, r);
  if (Object.hasOwn(r, "priority") && !Number.isFinite(Number(r.priority))) {
    errors.push(`${ruleContext} priority must be a finite number when present`);
  }
  const onContext = makeRuleContext(ruleId, "on");
  const on = asObj(r.on);
  pushUnsupportedKeys(errors, onContext, on, new Set(["all"]));
  const onAllConditions = on.all;
  if (!requireNonEmptyArray(errors, onAllConditions, `${ruleContext} must define ${LABEL_ON_ALL}[]`)) {
    return;
  }
  const conditionContext = makeRuleContext(ruleId, "condition");
  const seenConditions = new Set();
  for (const conditionRaw of onAllConditions) {
    const cond = asObj(conditionRaw);
    pushUnsupportedKeys(errors, conditionContext, cond, RULE_CONDITION_ALLOWED_KEYS);
    const type = asText(cond.type).toLowerCase();
    const id = asText(cond.id);
    const normalizedId = (!id || !type) ? "" : (id.startsWith(`${type}.`) ? id.slice(`${type}.`.length) : id);
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
    if (id && !(typeof normalizedId === "string" && ENTITY_ID_RE.test(normalizedId))) {
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
      if (type === "spell" && !Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedId)) {
        errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_OR_INACTIVE_SPELL}: ${id}`);
      } else if (type === "gesture" && !knownGestureIds.has(normalizedId)) {
        errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_GESTURE}: ${id}`);
      } else if (type === "orb_state" && !knownOrbStateIds.has(normalizedId)) {
        errors.push(`${ruleContext} ${ERR_REF_UNKNOWN_ORB_STATE}: ${id}`);
      }
    }
  }
  const thenActions = r.then;
  if (!requireNonEmptyArray(errors, thenActions, `${ruleContext} must define then[] actions`)) {
    return;
  }
  for (const actionRaw of thenActions) {
    const action = asObj(actionRaw);
    pushBooleanEnabledErrorWhenPresent(errors, ruleContext, action, "action enabled");
    const type = asText(action.type).toLowerCase();
    if (!["wake_win", "event"].includes(type)) {
      errors.push(`${ruleContext} has unsupported action type: ${type || "(empty)"}`);
      continue;
    }
    if (type === "wake_win") {
      const wakeWinContext = makeRuleContext(ruleId, "wake_win");
      if (Object.hasOwn(action, "ms")) {
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
          if (spellQualifiedPrefix && spellQualifiedPrefix !== "spell") {
            errors.push(
              `${wakeWinContext} spell prefix mismatch: ${id} (expected spell.* or unqualified id)`
            );
          }
          if (
            !(typeof id === "string" && ENTITY_ID_RE.test(id)) &&
            !(typeof normalizedSpellId === "string" && ENTITY_ID_RE.test(normalizedSpellId))
          ) {
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
      continue;
    }
    const eventId = asText(action.id);
    const normalizedEventId = normalizeEventId(eventId);
    const eventActionContext = `${ruleContext} event action`;
    if (!eventId) {
      errors.push(`${eventActionContext} requires id`);
      continue;
    }
    const eventQualifiedPrefix = getQualifiedPrefix(eventId);
    if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
      errors.push(
        `${ruleContext} event id prefix mismatch: ${eventId} (expected event.* or unqualified id)`
      );
      continue;
    }
    if (typeof normalizedEventId === "string" && ENTITY_ID_RE.test(normalizedEventId)) {
      pushEventIdReferenceErrors(
        errors,
        normalizedEventId,
        `${eventActionContext} references unknown event id: ${eventId}`,
        `${eventActionContext} references event without runtime binding: ${eventId}`
      );
    } else if (isBareNamespaceId(eventId)) {
      errors.push(`${eventActionContext} id is incomplete: ${eventId} (missing value after prefix)`);
    } else {
      errors.push(`${eventActionContext} has invalid id shape: ${eventId}`);
    }
    if (!Object.hasOwn(action, "overrides")) continue;
    if (!isPlainObject(action.overrides)) {
      errors.push(`${eventActionContext} overrides must be an object when present`);
      continue;
    }
    for (const key of Object.keys(action.overrides)) {
      if (!key) errors.push(`${eventActionContext} overrides contains empty key`);
      if (Object.hasOwn(action, key)) {
        errors.push(`${eventActionContext} has duplicate key in root and overrides: ${key}`);
      }
    }
  }
}

export function validateInteractionsV2(input = INTERACTIONS_V2) {
  const errors = [];
  const cfg = asObj(input);
  pushUnsupportedKeys(errors, ROOT_CONTEXT, cfg, ROOT_ALLOWED_KEYS);
  if (asText(cfg.version) !== INTERACTIONS_VERSION) {
    errors.push(`${ROOT_CONTEXT}.version must be "${INTERACTIONS_VERSION}"`);
  }
  if (typeof cfg.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(cfg.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return { ok: false, errors };
  }
  validateOptionalObjectSection(cfg, "defaults", (defaults) => {
    pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaults, DEFAULTS_ALLOWED_KEYS);
    validateOptionalObjectSection(defaults, "wakeWin", (wakeWin) => {
      pushUnsupportedKeys(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWin, new Set([FIELD_TTL_MS]));
      pushFiniteNonNegativeWhenPresent(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWin, FIELD_TTL_MS);
    });
    validateOptionalObjectSection(defaults, "event", (eventDefaults) => {
      const seenDefaultEventIds = new Set();
      for (const [eventId, eventArgs] of Object.entries(eventDefaults)) {
        const normalizedEventId = normalizeEventId(eventId);
        const eventDefaultPrefix = getQualifiedPrefix(eventId);
        if (eventDefaultPrefix && eventDefaultPrefix !== "event") {
          errors.push(
            `${DEFAULTS_EVENT_CONTEXT} key prefix mismatch: ${eventId} (expected event.* or unqualified id)`
          );
        } else if (typeof normalizedEventId === "string" && ENTITY_ID_RE.test(normalizedEventId)) {
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
        } else if (isBareNamespaceId(eventId)) {
          errors.push(`${DEFAULTS_EVENT_CONTEXT} key is incomplete: ${eventId} (missing value after prefix)`);
        } else {
          errors.push(`${DEFAULTS_EVENT_CONTEXT} key has invalid id shape: ${eventId}`);
        }
        if (!isPlainObject(eventArgs)) {
          errors.push(`${DEFAULTS_EVENT_CONTEXT}[${eventId}] must be an object`);
        }
      }
    });
  });
  const ids = new Set();
  for (const rawRule of cfg.rules) {
    validateRuleEntry(errors, ids, rawRule);
  }

  return { ok: errors.length === 0, errors };
}
