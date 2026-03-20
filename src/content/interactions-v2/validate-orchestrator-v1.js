import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";
import { SIGNAL_DEFINITIONS_BY_ID } from "../spell-rules/signal-definitions.js";
import {
  asOpenObject,
  asTriggerObject,
  hasNonEmptyArray,
  asObj,
  asText,
  isPlainObject,
  isStringOrArray,
  ORCHESTRATOR_MIN_MATCH_WINDOW_MS,
  OPEN_TTL_KEYS,
  RULE_COOLDOWN_KEYS,
  RULE_MATCH_WINDOW_KEYS,
  RULE_PRIORITY_KEY,
  RULE_PRIORITY_KEYS,
  TRIGGER_SOURCE_KEYS,
  normalizeSpellId,
  normalizeEventId,
  ON_SELECTOR_ALLOWED_KEYS,
  parseOnSelectorList,
  asSelectorList,
  requireNonEmptyArray,
  pushBooleanEnabledErrorWhenPresent,
  validateOptionalObjectSection,
  collectOnEntriesFromObjectSelectors,
  collectRuleTriggerEntries,
  getMergedDefaultTriggerEntries,
  pushUnsupportedKeys,
} from "./orchestrator-v1-normalizers.js";

const ROOT_CONTEXT = "ORCHESTRATOR_V1";
const DEFAULTS_CONTEXT = `${ROOT_CONTEXT}.defaults`;
const DEFAULTS_OPEN_CONTEXT = `${DEFAULTS_CONTEXT}.open`;
const DEFAULTS_TRIGGER_CONTEXT = `${DEFAULTS_CONTEXT}.trigger`;
const DEFAULTS_RULE_CONTEXT = `${DEFAULTS_CONTEXT}.rule`;
const signalDefsById = ((typeof SIGNAL_DEFINITIONS_BY_ID === "object" && SIGNAL_DEFINITIONS_BY_ID)
  ? SIGNAL_DEFINITIONS_BY_ID
  : {});

function pushNumericConstraintErrorWhenPresent(
  errors,
  context,
  numericFieldValues,
  fieldKey,
  isValid,
  constraintSuffix
) {
  if (!Object.hasOwn(numericFieldValues, fieldKey)) return;
  if (!isValid(Number(numericFieldValues[fieldKey]))) {
    errors.push(
      `${context.startsWith("rule ") ? `${context} ${fieldKey}` : `${context}.${fieldKey}`} ${constraintSuffix}`
    );
  }
}

function validateRuleNumericKeys(errors, context, ruleNumericValues) {
  pushNumericConstraintErrorWhenPresent(
    errors,
    context,
    ruleNumericValues,
    RULE_PRIORITY_KEY,
    Number.isFinite,
    "must be a finite number when present"
  );
  for (const cooldownKey of RULE_COOLDOWN_KEYS) {
    pushNumericConstraintErrorWhenPresent(
      errors,
      context,
      ruleNumericValues,
      cooldownKey,
      (numericValue) => Number.isFinite(numericValue) && numericValue >= 0,
      "must be a finite number >= 0 when present"
    );
  }
  for (const matchWindowKey of RULE_MATCH_WINDOW_KEYS) {
    pushNumericConstraintErrorWhenPresent(
      errors,
      context,
      ruleNumericValues,
      matchWindowKey,
      (numericValue) => Number.isFinite(numericValue) && numericValue >= ORCHESTRATOR_MIN_MATCH_WINDOW_MS,
      `must be a finite number >= ${ORCHESTRATOR_MIN_MATCH_WINDOW_MS} when present`
    );
  }
}

function validateOpenTtlKeys(errors, context, openTtlValues) {
  for (const ttlKey of OPEN_TTL_KEYS) {
    pushNumericConstraintErrorWhenPresent(
      errors,
      context,
      openTtlValues,
      ttlKey,
      (numericValue) => Number.isFinite(numericValue) && numericValue >= 0,
      "must be a finite number >= 0 when present"
    );
  }
}

function makeRuleContext(ruleId, sectionName = "") {
  return sectionName ? `rule ${ruleId} ${sectionName}` : `rule ${ruleId}`;
}

function getKnownSignalIds(signalPrefix) {
  return new Set(
    Object.keys(signalDefsById)
      .filter((signalId) => typeof signalId === "string" && signalId.startsWith(signalPrefix))
      .map((signalId) => signalId.slice(signalPrefix.length))
      .filter(Boolean)
  );
}

const knownGestureSignalIds = getKnownSignalIds("gesture.");

function pushDuplicateWhenSeen(errors, seenSet, entryValue, duplicateMessage) {
  if (seenSet.has(entryValue)) {
    errors.push(duplicateMessage);
    return true;
  }
  seenSet.add(entryValue);
  return false;
}
const knownOrbStateSignalIds = getKnownSignalIds("orb_state.");

function validateRuleEntry(errors, seenRuleIds, ruleSourceRaw) {
  const ruleConfig = asObj(ruleSourceRaw);
  const ruleId = asText(ruleConfig.id);
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
  pushUnsupportedKeys(errors, ruleContext, ruleConfig, new Set([
    "id",
    "on",
    "open",
    ...TRIGGER_SOURCE_KEYS,
    "enabled",
    ...RULE_PRIORITY_KEYS,
    ...RULE_COOLDOWN_KEYS,
    ...RULE_MATCH_WINDOW_KEYS,
  ]));
  pushBooleanEnabledErrorWhenPresent(errors, ruleContext, ruleConfig);
  validateRuleNumericKeys(errors, ruleContext, ruleConfig);
  const onSelectorContext = makeRuleContext(ruleId, "on");
  let onSelectorSpecs = [];
  if (isStringOrArray(ruleConfig.on)) {
    onSelectorSpecs = parseOnSelectorList(ruleConfig.on, { invalidAsEmptyObject: true });
  } else {
    const onConfig = asObj(ruleConfig.on);
    pushUnsupportedKeys(errors, onSelectorContext, onConfig, ON_SELECTOR_ALLOWED_KEYS);
    onSelectorSpecs = collectOnEntriesFromObjectSelectors(onConfig, { includeRaw: true });
  }
  if (!requireNonEmptyArray(errors, onSelectorSpecs, `${ruleContext} must define on selectors`)) {
    return;
  }
  const seenOnSelectorRefs = new Set();
  for (const onEntry of onSelectorSpecs) {
    const selectorType = asText(onEntry?.type).toLowerCase();
    const selectorValueId = asText(onEntry?.id).toLowerCase();
    const selectorInputId = onEntry.raw || selectorValueId;
    if (!["spell", "gesture", "orb_state"].includes(selectorType)) {
      errors.push(`${ruleContext} has unsupported on selector type`);
      continue;
    }
    if (!selectorValueId) {
      errors.push(`${ruleContext} has empty on.${selectorType}`);
      continue;
    }
    const onSelectorRefId = `${selectorType}.${selectorValueId}`;
    if (pushDuplicateWhenSeen(
      errors,
      seenOnSelectorRefs,
      onSelectorRefId,
      `${ruleContext} contains duplicate on selector: ${onSelectorRefId}`
    )) {
      continue;
    }
    if (selectorType === "spell" && !Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, selectorValueId)) {
      errors.push(`${ruleContext} references inactive or unknown spell id: ${selectorInputId}`);
    } else if (selectorType === "gesture" && !knownGestureSignalIds.has(selectorValueId)) {
      errors.push(`${ruleContext} references unknown gesture id: ${selectorInputId}`);
    } else if (selectorType === "orb_state" && !knownOrbStateSignalIds.has(selectorValueId)) {
      errors.push(`${ruleContext} references unknown orb_state id: ${selectorInputId}`);
    }
  }
  const hasOpenAction = Object.hasOwn(ruleConfig, "open");
  const openConfig = hasOpenAction ? asOpenObject(ruleConfig.open) : null;
  if (openConfig) {
    const openActionContext = makeRuleContext(ruleId, "open");
    pushUnsupportedKeys(
      errors,
      openActionContext,
      openConfig,
      new Set(["spells", ...OPEN_TTL_KEYS, "enabled"])
    );
    pushBooleanEnabledErrorWhenPresent(errors, openActionContext, openConfig);
    validateOpenTtlKeys(errors, openActionContext, openConfig);
    const openSpellEntries = asSelectorList(openConfig.spells);
    if (requireNonEmptyArray(errors, openSpellEntries, `${openActionContext} requires spells[]`)) {
      const seenOpenSpellIds = new Set();
      for (const openSpellId of openSpellEntries) {
        const normalizedOpenSpell = normalizeSpellId(openSpellId);
        if (!normalizedOpenSpell) {
          errors.push(`${openActionContext} contains empty spell id`);
          continue;
        }
        pushDuplicateWhenSeen(
          errors,
          seenOpenSpellIds,
          normalizedOpenSpell,
          `${openActionContext} contains duplicate spell id: ${openSpellId}`
        );
        if (!Object.hasOwn(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedOpenSpell)) {
          errors.push(`${openActionContext} references inactive or unknown spell id: ${openSpellId}`);
        }
      }
    }
  }
  const triggerEntries = collectRuleTriggerEntries(ruleConfig, TRIGGER_SOURCE_KEYS);
  if (hasOpenAction || hasNonEmptyArray(triggerEntries)) {
    const triggerActionContext = makeRuleContext(ruleId, "trigger");
    for (const triggerEntry of triggerEntries) {
      const triggerAction = asTriggerObject(triggerEntry);
      pushUnsupportedKeys(
        errors,
        triggerActionContext,
        triggerAction,
        new Set(["event", "enabled", "args"])
      );
      pushBooleanEnabledErrorWhenPresent(errors, triggerActionContext, triggerAction);
      const normalizedTriggerEventId = normalizeEventId(triggerAction.event);
      if (!normalizedTriggerEventId) {
        errors.push(`${triggerActionContext} is missing event`);
      } else if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedTriggerEventId)) {
        errors.push(`${triggerActionContext} references unknown event id: ${triggerAction.event}`);
      }
      if (
        typeof triggerEntry !== "string" &&
        Object.hasOwn(triggerAction, "args") &&
        !isPlainObject(triggerAction.args)
      ) {
        errors.push(`${triggerActionContext} args must be an object when present`);
      }
    }
    return;
  }
  errors.push(`${ruleContext} must define open and/or trigger actions`);
}

export function validateOrchestratorV1(orchestratorInput) {
  const errors = [];
  const orchestratorConfig = asObj(orchestratorInput);
  pushUnsupportedKeys(errors, ROOT_CONTEXT, orchestratorConfig, new Set(["version", "enabled", "defaults", "rules"]));
  if (asText(orchestratorConfig.version) !== "1") {
    errors.push(`${ROOT_CONTEXT}.version must be "1"`);
  }
  if (typeof orchestratorConfig.enabled !== "boolean") {
    errors.push(`${ROOT_CONTEXT}.enabled must be boolean`);
  }
  if (!Array.isArray(orchestratorConfig.rules)) {
    errors.push(`${ROOT_CONTEXT}.rules must be an array`);
    return errors;
  }
  validateOptionalObjectSection(orchestratorConfig, "defaults", (defaultsSection) => {
    pushUnsupportedKeys(
      errors,
      DEFAULTS_CONTEXT,
      defaultsSection,
      new Set(["open", ...TRIGGER_SOURCE_KEYS, "rule"])
    );
    validateOptionalObjectSection(defaultsSection, "open", (openDefaultsSection) => {
      pushUnsupportedKeys(errors, DEFAULTS_OPEN_CONTEXT, openDefaultsSection, OPEN_TTL_KEYS);
      validateOpenTtlKeys(errors, DEFAULTS_OPEN_CONTEXT, openDefaultsSection);
    });
    for (const [triggerDefaultEventId, triggerDefaultOverrides] of getMergedDefaultTriggerEntries(defaultsSection)) {
      const normalizedTriggerDefaultEventId = normalizeEventId(triggerDefaultEventId);
      if (!normalizedTriggerDefaultEventId) {
        errors.push(`${DEFAULTS_TRIGGER_CONTEXT} has invalid event key: ${triggerDefaultEventId}`);
        continue;
      }
      if (!Object.hasOwn(EVENT_DEFINITIONS_BY_ID, normalizedTriggerDefaultEventId)) {
        errors.push(`${DEFAULTS_TRIGGER_CONTEXT} references unknown event id: ${triggerDefaultEventId}`);
        continue;
      }
      if (!isPlainObject(triggerDefaultOverrides)) {
        errors.push(`${DEFAULTS_TRIGGER_CONTEXT}[${triggerDefaultEventId}] must be an object`);
      }
    }
    validateOptionalObjectSection(defaultsSection, "rule", (ruleDefaultsSection) => {
      pushUnsupportedKeys(
        errors,
        DEFAULTS_RULE_CONTEXT,
        ruleDefaultsSection,
        new Set([...RULE_COOLDOWN_KEYS, ...RULE_MATCH_WINDOW_KEYS, ...RULE_PRIORITY_KEYS])
      );
      validateRuleNumericKeys(errors, DEFAULTS_RULE_CONTEXT, ruleDefaultsSection);
    });
  });
  const seenRuleIds = new Set();
  for (const ruleEntry of orchestratorConfig.rules) {
    validateRuleEntry(errors, seenRuleIds, ruleEntry);
  }
  return errors;
}
