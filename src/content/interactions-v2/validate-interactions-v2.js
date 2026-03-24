import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js";
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
} from "./interactions-v2-normalizers.js";

const ROOT_CONTEXT = "INTERACTIONS_V2";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_WAKE_WIN_CONTEXT = `${DEFAULTS_CONTEXT}.wakeWin`;
const DEFAULTS_EVENT_CONTEXT = `${DEFAULTS_CONTEXT}.event`;
const ENTITY_ID_RE = /^[A-Za-z0-9_]+$/;
const BARE_NAMESPACE_RE = /^[a-z_]+\.$/;
const CONDITION_TYPE_WORD = "word";
const CONDITION_TYPE_GESTURE = "gesture";
const CONDITION_TYPE_ORB_STATE = "orb_state";
const CONDITION_SIGNAL_TYPE = CONDITION_TYPE_WORD;
const signalDefsById = ((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
  ? SIGNAL_DEFINITIONS_BY_ID
  : {});

function makeRuleContext(ruleId, sectionSuffix = "") {
  return sectionSuffix ? `rule ${ruleId} ${sectionSuffix}` : `rule ${ruleId}`;
}

function getQualifiedPrefix(rawId) {
  const normalizedId = asText(rawId).toLowerCase();
  const dotIndex = normalizedId.indexOf(".");
  if (dotIndex <= 0) return "";
  return normalizedId.slice(0, dotIndex);
}

function isBareNamespaceId(candidateIdRaw) {
  return BARE_NAMESPACE_RE.test(asText(candidateIdRaw).toLowerCase());
}

function normalizeConditionType(conditionTypeRaw) {
  return asText(conditionTypeRaw).toLowerCase();
}

function normalizeConditionId(conditionIdRaw, conditionTypeRaw) {
  const conditionType = normalizeConditionType(conditionTypeRaw);
  const conditionId = asText(conditionIdRaw);
  if (!conditionType || !conditionId) return "";
  if (conditionType === CONDITION_SIGNAL_TYPE) {
    if (conditionId.startsWith("spell.")) return "";
    if (conditionId.startsWith("word.")) return conditionId.slice("word.".length);
    return conditionId;
  }
  if (conditionId.startsWith(`${conditionType}.`)) {
    return conditionId.slice(`${conditionType}.`.length);
  }
  return conditionId;
}

function getKnownSignalIds(namespacePrefix) {
  return new Set(
    Object.keys(signalDefsById)
      .filter((signalId) => typeof signalId === "string" && signalId.startsWith(namespacePrefix))
      .map((signalId) => signalId.slice(namespacePrefix.length))
      .filter(Boolean)
  );
}

const knownGestureSignalIds = getKnownSignalIds("gesture.");
const knownOrbStateSignalIds = getKnownSignalIds("orb_state.");

function pushNonNegativeNumericConstraintWhenPresent(errors, errorContext, numericFields, numericFieldKey) {
  if (!Object.hasOwn(numericFields, numericFieldKey)) return;
  const numericValue = Number(numericFields[numericFieldKey]);
  if (!(Number.isFinite(numericValue) && numericValue >= 0)) {
    errors.push(`${errorContext}.${numericFieldKey} must be a finite number >= 0 when present`);
  }
}

function pushEventIdReferenceErrors(
  errors,
  eventId,
  unknownEventError,
  missingRuntimeBindingError = ""
) {
  if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, eventId)) {
    errors.push(unknownEventError);
    return false;
  }
  if (
    missingRuntimeBindingError &&
    !Object.hasOwn(EVENT_RUNTIME_BINDINGS_BY_ID, eventId)
  ) {
    errors.push(missingRuntimeBindingError);
  }
  return true;
}

function pushDuplicateWhenSeen(errors, seenValues, candidateValue, duplicateError) {
  if (seenValues.has(candidateValue)) {
    errors.push(duplicateError);
    return true;
  }
  seenValues.add(candidateValue);
  return false;
}

function validateRuleEntry(errors, seenRuleIds, ruleSourceRaw) {
  const ruleDoc = asObj(ruleSourceRaw);
  const ruleId = asText(ruleDoc.id);
  if (!ruleId) {
    errors.push(`${ROOT_CONTEXT}.rules[] entry is missing id`);
    return;
  }
  pushDuplicateWhenSeen(
    errors,
    seenRuleIds,
    ruleId,
    `${ROOT_CONTEXT}.rules contains duplicate id: ${ruleId}`
  );
  const ruleContext = makeRuleContext(ruleId);
  pushUnsupportedKeys(errors, ruleContext, ruleDoc, new Set(["id", "on", "then", "enabled", "priority"]));
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, ruleDoc);
  if (Object.hasOwn(ruleDoc, "priority") && !Number.isFinite(Number(ruleDoc.priority))) {
    errors.push(`${ruleContext} priority must be a finite number when present`);
  }
  const onRuleContext = makeRuleContext(ruleId, "on");
  const onSection = asObj(ruleDoc.on);
  pushUnsupportedKeys(errors, onRuleContext, onSection, new Set(["all"]));
  const onAllConditions = onSection.all;
  if (!requireNonEmptyArray(errors, onAllConditions, `${ruleContext} must define on.all[]`)) {
    return;
  }
  const conditionRuleContext = makeRuleContext(ruleId, "condition");
  const seenConditionSignatures = new Set();
  for (const rawCondition of onAllConditions) {
    const conditionDoc = asObj(rawCondition);
    pushUnsupportedKeys(errors, conditionRuleContext, conditionDoc, new Set(["type", "id"]));
    const conditionTypeInput = asText(conditionDoc.type).toLowerCase();
    const conditionType = normalizeConditionType(conditionTypeInput);
    const conditionId = asText(conditionDoc.id);
    const normalizedConditionId = normalizeConditionId(conditionId, conditionTypeInput);
    if (!conditionType) errors.push(`${ruleContext} has on.all condition missing type`);
    if (!conditionId) errors.push(`${ruleContext} has on.all condition missing id`);
    if (
      conditionTypeInput &&
      ![CONDITION_TYPE_WORD, CONDITION_TYPE_GESTURE, CONDITION_TYPE_ORB_STATE].includes(conditionTypeInput)
    ) {
      errors.push(`${ruleContext} has unsupported on.all condition type: ${conditionTypeInput}`);
    }
    const conditionIdPrefix = getQualifiedPrefix(conditionId);
    const isWordFamily = conditionType === CONDITION_SIGNAL_TYPE;
    const conditionPrefixMismatched = isWordFamily
      ? (conditionIdPrefix && conditionIdPrefix !== CONDITION_TYPE_WORD)
      : (conditionType && conditionIdPrefix && conditionIdPrefix !== conditionType);
    if (conditionPrefixMismatched) {
      errors.push(
        `${ruleContext} condition type/id prefix mismatch: type=${conditionTypeInput} id=${conditionId} (expected ${isWordFamily ? "word.*" : `${conditionType}.*`} or unqualified id)`
      );
    }
    if (
      conditionId &&
      !(typeof normalizedConditionId === "string" && ENTITY_ID_RE.test(normalizedConditionId))
    ) {
      if (isBareNamespaceId(conditionId)) {
        errors.push(`${ruleContext} has incomplete on.all id: ${conditionId} (missing value after prefix)`);
      } else {
        errors.push(`${ruleContext} has invalid on.all id shape (use letters/numbers/_): ${conditionId}`);
      }
    }
    if (conditionType && conditionId) {
      pushDuplicateWhenSeen(
        errors,
        seenConditionSignatures,
        `${conditionType}:${normalizedConditionId}`,
        `${ruleContext} contains duplicate on.all condition: ${conditionTypeInput}.${conditionId}`
      );
    }
    if (conditionId && conditionType) {
      if (
        conditionType === CONDITION_SIGNAL_TYPE &&
        !Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedConditionId)
      ) {
        errors.push(`${ruleContext} references inactive or unknown word id: ${conditionId}`);
      } else if (conditionType === CONDITION_TYPE_GESTURE && !knownGestureSignalIds.has(normalizedConditionId)) {
        errors.push(`${ruleContext} references unknown gesture id: ${conditionId}`);
      } else if (conditionType === CONDITION_TYPE_ORB_STATE && !knownOrbStateSignalIds.has(normalizedConditionId)) {
        errors.push(`${ruleContext} references unknown orb_state id: ${conditionId}`);
      }
    }
  }
  const thenActions = ruleDoc.then;
  if (!requireNonEmptyArray(errors, thenActions, `${ruleContext} must define then[] actions`)) {
    return;
  }
  for (const rawAction of thenActions) {
    const action = asObj(rawAction);
    pushBooleanEnabledErrorWhenPresent(errors, ruleContext, action, "action enabled");
    const actionType = asText(action.type).toLowerCase();
    if (!["wake_win", "event"].includes(actionType)) {
      errors.push(`${ruleContext} has unsupported action type: ${actionType || "(empty)"}`);
      continue;
    }
    if (actionType === "wake_win") {
      const wakeWinActionContext = makeRuleContext(ruleId, "wake_win");
      if (Object.hasOwn(action, "ms")) {
        errors.push(`${ruleContext} wake_win should use ttlMs, not ms`);
      }
      const hasWords = Object.hasOwn(action, "words");
      const hasSpells = Object.hasOwn(action, "spells");
      const wakeWordRefs = hasWords ? action.words : action.spells;
      pushUnsupportedKeys(
        errors,
        wakeWinActionContext,
        action,
        new Set(["type", "words", "spells", "ttlMs", "enabled"])
      );
      if (hasWords && hasSpells) {
        const lhs = JSON.stringify(Array.isArray(action.words) ? action.words : []);
        const rhs = JSON.stringify(Array.isArray(action.spells) ? action.spells : []);
        if (lhs !== rhs) {
          errors.push(`${wakeWinActionContext} words and spells alias must match when both are present`);
        }
      }
      if (!Array.isArray(wakeWordRefs) || !wakeWordRefs.length) {
        errors.push(`${wakeWinActionContext} action requires non-empty words[] (or spells[] alias)`);
      } else {
        const seenWakeSpellIds = new Set();
        for (const rawWakeSpell of wakeWordRefs) {
          const wakeSpellId = asText(rawWakeSpell);
          const normalizedWakeSpellId = normalizeSpellId(wakeSpellId);
          const wakeSpellPrefix = getQualifiedPrefix(wakeSpellId);
          if (wakeSpellPrefix && wakeSpellPrefix !== "spell" && wakeSpellPrefix !== "word") {
            errors.push(
              `${wakeWinActionContext} word prefix mismatch: ${wakeSpellId} (expected word.* | spell.* or unqualified id)`
            );
          }
          if (
            !(typeof wakeSpellId === "string" && ENTITY_ID_RE.test(wakeSpellId)) &&
            !(typeof normalizedWakeSpellId === "string" && ENTITY_ID_RE.test(normalizedWakeSpellId))
          ) {
            errors.push(`${wakeWinActionContext} spell has invalid id shape: ${wakeSpellId}`);
            continue;
          }
          if (!normalizedWakeSpellId) {
            if (isBareNamespaceId(wakeSpellId)) {
              errors.push(
                `${wakeWinActionContext} word id is incomplete: ${wakeSpellId} (missing value after prefix)`
              );
            } else {
              errors.push(`${wakeWinActionContext} word id is empty`);
            }
            continue;
          }
          pushDuplicateWhenSeen(
            errors,
            seenWakeSpellIds,
            normalizedWakeSpellId,
            `${wakeWinActionContext} contains duplicate word id: ${wakeSpellId}`
          );
          if (!Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, normalizedWakeSpellId)) {
            errors.push(`${wakeWinActionContext} references inactive or unknown word id: ${wakeSpellId}`);
          }
        }
      }
      pushNonNegativeNumericConstraintWhenPresent(errors, wakeWinActionContext, action, "ttlMs");
      continue;
    }
    const eventId = asText(action.id);
    const normalizedActionEventId = normalizeEventId(eventId);
    const eventActionContext = `${ruleContext} event action`;
    if (!eventId) {
      errors.push(`${eventActionContext} requires id`);
      continue;
    }
    const eventIdPrefix = getQualifiedPrefix(eventId);
    if (eventIdPrefix && eventIdPrefix !== "event") {
      errors.push(
        `${ruleContext} event id prefix mismatch: ${eventId} (expected event.* or unqualified id)`
      );
      continue;
    }
    if (
      typeof normalizedActionEventId === "string" &&
      ENTITY_ID_RE.test(normalizedActionEventId)
    ) {
      pushEventIdReferenceErrors(
        errors,
        normalizedActionEventId,
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
    for (const overrideKey of Object.keys(action.overrides)) {
      if (!overrideKey) errors.push(`${eventActionContext} overrides contains empty key`);
      if (Object.hasOwn(action, overrideKey)) {
        errors.push(`${eventActionContext} has duplicate key in root and overrides: ${overrideKey}`);
      }
    }
  }
}

export function validateInteractionsV2(interactionsInput = INTERACTIONS_V2) {
  const errors = [];
  const interactionsDoc = asObj(interactionsInput);
  pushUnsupportedKeys(errors, ROOT_CONTEXT, interactionsDoc, new Set(["version", "enabled", "defaults", "rules"]));
  if (asText(interactionsDoc.version) !== "2") {
    errors.push(`${ROOT_CONTEXT}.version must be "2"`);
  }
  if (typeof interactionsDoc.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(interactionsDoc.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return { ok: false, errors };
  }
  validateOptionalObjectSection(interactionsDoc, "defaults", (defaultsSection) => {
    pushUnsupportedKeys(errors, DEFAULTS_CONTEXT, defaultsSection, new Set(["wakeWin", "event"]));
    validateOptionalObjectSection(defaultsSection, "wakeWin", (wakeWinDefaultsSection) => {
      pushUnsupportedKeys(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWinDefaultsSection, new Set(["ttlMs"]));
      pushNonNegativeNumericConstraintWhenPresent(errors, DEFAULTS_WAKE_WIN_CONTEXT, wakeWinDefaultsSection, "ttlMs");
    });
    validateOptionalObjectSection(defaultsSection, "event", (eventDefaultsMap) => {
      const seenDefaultEventIds = new Set();
      for (const [defaultEventId, eventDefaultOverrides] of Object.entries(eventDefaultsMap)) {
        const normalizedDefaultEventKey = normalizeEventId(defaultEventId);
        const defaultEventIdPrefix = getQualifiedPrefix(defaultEventId);
        if (defaultEventIdPrefix && defaultEventIdPrefix !== "event") {
          errors.push(
            `${DEFAULTS_EVENT_CONTEXT} key prefix mismatch: ${defaultEventId} (expected event.* or unqualified id)`
          );
        } else if (
          typeof normalizedDefaultEventKey === "string" &&
          ENTITY_ID_RE.test(normalizedDefaultEventKey)
        ) {
          if (pushEventIdReferenceErrors(
            errors,
            normalizedDefaultEventKey,
            `${DEFAULTS_EVENT_CONTEXT} references unknown event id: ${defaultEventId}`
          )) {
            pushDuplicateWhenSeen(
              errors,
              seenDefaultEventIds,
              normalizedDefaultEventKey,
              `${DEFAULTS_EVENT_CONTEXT} contains duplicate normalized key: ${defaultEventId}`
            );
          }
        } else if (isBareNamespaceId(defaultEventId)) {
          errors.push(`${DEFAULTS_EVENT_CONTEXT} key is incomplete: ${defaultEventId} (missing value after prefix)`);
        } else {
          errors.push(`${DEFAULTS_EVENT_CONTEXT} key has invalid id shape: ${defaultEventId}`);
        }
        if (!isPlainObject(eventDefaultOverrides)) {
          errors.push(`${DEFAULTS_EVENT_CONTEXT}[${defaultEventId}] must be an object`);
        }
      }
    });
  });
  const seenRuleIds = new Set();
  for (const ruleSource of interactionsDoc.rules) {
    validateRuleEntry(errors, seenRuleIds, ruleSource);
  }

  return { ok: errors.length === 0, errors };
}
