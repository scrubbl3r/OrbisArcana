import { validateSpellRules } from "./validate-spell-rules.js";
import { RULE_ENGINE_MASTER_CONTROL } from "./index.js";

const DEFAULT_MASTER_CONTROL = (RULE_ENGINE_MASTER_CONTROL && typeof RULE_ENGINE_MASTER_CONTROL === "object")
  ? RULE_ENGINE_MASTER_CONTROL
  : Object.create(null);

function asObj(v) {
  return (v && typeof v === "object") ? v : Object.create(null);
}

function asText(v) {
  return String(v || "").trim();
}

function isFiniteNumber(v) {
  return Number.isFinite(Number(v));
}

function asActionType(v) {
  return String(v || "").trim().toLowerCase();
}

function asActionId(v, type = "") {
  const id = String(v || "").trim().toLowerCase();
  if (id) return id;
  return (type === "wake_win") ? "wake_win" : "";
}

function getRuleActions(rule) {
  const then = rule && rule.then;
  if (Array.isArray(then)) return then;
  if (then && typeof then === "object") return [then];
  return [];
}

function parseActionOverrideKey(rawKey) {
  const key = String(rawKey || "").trim();
  if (!key) return null;
  const parts = key.split(".");
  if (parts.length === 2) {
    const [ruleId, indexRaw] = parts;
    const index = Number(indexRaw);
    if (!ruleId || !Number.isInteger(index) || index < 0) return null;
    return { ruleId, type: "", selector: "", index };
  }
  if (parts.length === 3) {
    const [ruleId, typeRaw, selectorRaw] = parts;
    if (!ruleId || !typeRaw || !selectorRaw) return null;
    const type = asActionType(typeRaw);
    const index = Number(selectorRaw);
    if (Number.isInteger(index) && index >= 0) {
      return { ruleId, type, selector: "", index };
    }
    return { ruleId, type, selector: String(selectorRaw || "").trim().toLowerCase(), index: -1 };
  }
  return null;
}

function actionOverrideKeyTargetsExistingAction(rule, parsed) {
  if (!rule || !parsed) return false;
  const actions = getRuleActions(rule);
  if (!actions.length) return false;
  if (Number.isInteger(parsed.index) && parsed.index >= 0) {
    const action = actions[parsed.index];
    if (!action) return false;
    if (!parsed.type) return true;
    return asActionType(action && action.type) === parsed.type;
  }
  if (!parsed.type || !parsed.selector) return false;
  for (const action of actions) {
    const type = asActionType(action && action.type);
    if (type !== parsed.type) continue;
    const id = asActionId(action && action.id, type);
    if (id === parsed.selector) return true;
  }
  return false;
}

export function validateRuleEngineConfig(config = null) {
  const source = (config && typeof config === "object")
    ? config
    : DEFAULT_MASTER_CONTROL;
  const cfg = asObj(source);
  const signals = Array.isArray(cfg.signals) ? cfg.signals : [];
  const windows = Array.isArray(cfg.windows) ? cfg.windows : [];
  const events = Array.isArray(cfg.events) ? cfg.events : [];
  const rules = Array.isArray(cfg.rules) ? cfg.rules : [];
  const eventRuntimeBindings = asObj(cfg.eventRuntimeBindings);
  const execution = asObj(cfg.execution);
  const ruleDefaults = asObj(cfg.ruleDefaults);
  const rulePriorityOverrides = asObj(cfg.rulePriorityOverrides);
  const ruleTimingOverrides = asObj(cfg.ruleTimingOverrides);
  const ruleActionLimitOverrides = asObj(cfg.ruleActionLimitOverrides);
  const ruleCooldownScaleOverrides = asObj(cfg.ruleCooldownScaleOverrides);
  const ruleMatchWindowScaleOverrides = asObj(cfg.ruleMatchWindowScaleOverrides);
  const ruleEmitPreviewMatchedOverrides = asObj(cfg.ruleEmitPreviewMatchedOverrides);
  const ruleEmitActionExecutedOverrides = asObj(cfg.ruleEmitActionExecutedOverrides);
  const ruleEmitSourceEventSummaryOverrides = asObj(cfg.ruleEmitSourceEventSummaryOverrides);
  const ruleSummaryIncludeSignalAndRuleIdsOverrides = asObj(cfg.ruleSummaryIncludeSignalAndRuleIdsOverrides);
  const ruleSummaryIncludeBudgetCapsOverrides = asObj(cfg.ruleSummaryIncludeBudgetCapsOverrides);
  const ruleActionExecutedEventTypeEnabledOverrides = asObj(cfg.ruleActionExecutedEventTypeEnabledOverrides);
  const ruleExecuteActionsOverrides = asObj(cfg.ruleExecuteActionsOverrides);
  const ruleActionTypeEnabledOverrides = asObj(cfg.ruleActionTypeEnabledOverrides);
  const signalEnabledOverrides = asObj(cfg.signalEnabledOverrides);
  const signalDebounceOverrides = asObj(cfg.signalDebounceOverrides);
  const signalMaxMatchesOverrides = asObj(cfg.signalMaxMatchesOverrides);
  const signalEmitPreviewMatchedOverrides = asObj(cfg.signalEmitPreviewMatchedOverrides);
  const signalStopOnFirstMatchOverrides = asObj(cfg.signalStopOnFirstMatchOverrides);
  const signalExecuteActionsOverrides = asObj(cfg.signalExecuteActionsOverrides);
  const signalActionTypeEnabledOverrides = asObj(cfg.signalActionTypeEnabledOverrides);
  const signalMatchWindowScaleOverrides = asObj(cfg.signalMatchWindowScaleOverrides);
  const signalCooldownScaleOverrides = asObj(cfg.signalCooldownScaleOverrides);
  const signalMaxActionsPerRuleMatchOverrides = asObj(cfg.signalMaxActionsPerRuleMatchOverrides);
  const signalMaxRulesEvaluatedOverrides = asObj(cfg.signalMaxRulesEvaluatedOverrides);
  const signalMaxActionsPerEventOverrides = asObj(cfg.signalMaxActionsPerEventOverrides);
  const signalMaxActionsPerSignalOverrides = asObj(cfg.signalMaxActionsPerSignalOverrides);
  const signalEmitActionExecutedOverrides = asObj(cfg.signalEmitActionExecutedOverrides);
  const signalEmitSourceEventSummaryOverrides = asObj(cfg.signalEmitSourceEventSummaryOverrides);
  const signalSummaryIncludeSignalAndRuleIdsOverrides = asObj(cfg.signalSummaryIncludeSignalAndRuleIdsOverrides);
  const signalSummaryIncludeBudgetCapsOverrides = asObj(cfg.signalSummaryIncludeBudgetCapsOverrides);
  const signalActionExecutedEventTypeEnabledOverrides = asObj(cfg.signalActionExecutedEventTypeEnabledOverrides);
  const signalMaxMatchesPerEventOverrides = asObj(cfg.signalMaxMatchesPerEventOverrides);
  const signalMaxSignalsPerEventOverrides = asObj(cfg.signalMaxSignalsPerEventOverrides);
  const signalMaxSignalsEvaluatedPerEventOverrides = asObj(cfg.signalMaxSignalsEvaluatedPerEventOverrides);
  const signalMaxRulesEvaluatedPerEventOverrides = asObj(cfg.signalMaxRulesEvaluatedPerEventOverrides);
  const signalStopOnFirstSignalMatchPerEventOverrides = asObj(cfg.signalStopOnFirstSignalMatchPerEventOverrides);
  const signalPriorityOverrides = asObj(cfg.signalPriorityOverrides);
  const signalSourceEventOverrides = asObj(cfg.signalSourceEventOverrides);
  const signalWhereOverrides = asObj(cfg.signalWhereOverrides);
  const sourceEventEnabledOverrides = asObj(cfg.sourceEventEnabledOverrides);
  const sourceEventDebounceOverrides = asObj(cfg.sourceEventDebounceOverrides);
  const sourceEventMaxSignalsOverrides = asObj(cfg.sourceEventMaxSignalsOverrides);
  const sourceEventMaxSignalsEvaluatedPerEventOverrides = asObj(cfg.sourceEventMaxSignalsEvaluatedPerEventOverrides);
  const sourceEventMaxActionsPerSignalOverrides = asObj(cfg.sourceEventMaxActionsPerSignalOverrides);
  const sourceEventMaxRulesEvaluatedOverrides = asObj(cfg.sourceEventMaxRulesEvaluatedOverrides);
  const sourceEventMaxRulesEvaluatedPerEventOverrides = asObj(cfg.sourceEventMaxRulesEvaluatedPerEventOverrides);
  const sourceEventMaxMatchesPerEventOverrides = asObj(cfg.sourceEventMaxMatchesPerEventOverrides);
  const sourceEventMaxActionsPerEventOverrides = asObj(cfg.sourceEventMaxActionsPerEventOverrides);
  const sourceEventStopOnFirstSignalMatchOverrides = asObj(cfg.sourceEventStopOnFirstSignalMatchOverrides);
  const sourceEventEmitPreviewMatchedOverrides = asObj(cfg.sourceEventEmitPreviewMatchedOverrides);
  const sourceEventEmitActionExecutedOverrides = asObj(cfg.sourceEventEmitActionExecutedOverrides);
  const sourceEventEmitSourceEventSummaryOverrides = asObj(cfg.sourceEventEmitSourceEventSummaryOverrides);
  const sourceEventSummaryIncludeSignalAndRuleIdsOverrides = asObj(cfg.sourceEventSummaryIncludeSignalAndRuleIdsOverrides);
  const sourceEventSummaryIncludeBudgetCapsOverrides = asObj(cfg.sourceEventSummaryIncludeBudgetCapsOverrides);
  const sourceEventActionTypeEnabledOverrides = asObj(cfg.sourceEventActionTypeEnabledOverrides);
  const sourceEventActionExecutedEventTypeEnabledOverrides = asObj(cfg.sourceEventActionExecutedEventTypeEnabledOverrides);
  const sourceEventExecuteActionsOverrides = asObj(cfg.sourceEventExecuteActionsOverrides);
  const sourceEventCooldownScaleOverrides = asObj(cfg.sourceEventCooldownScaleOverrides);
  const sourceEventMatchWindowScaleOverrides = asObj(cfg.sourceEventMatchWindowScaleOverrides);
  const sourceEventMaxActionsPerRuleMatchOverrides = asObj(cfg.sourceEventMaxActionsPerRuleMatchOverrides);
  const sourceEventStopOnFirstMatchOverrides = asObj(cfg.sourceEventStopOnFirstMatchOverrides);
  const sourceEventMaxMatchesPerSignalOverrides = asObj(cfg.sourceEventMaxMatchesPerSignalOverrides);
  const ruleEnabledOverrides = asObj(cfg.ruleEnabledOverrides);
  const actionEnabledOverrides = asObj(cfg.actionEnabledOverrides);
  const actionArgOverrides = asObj(cfg.actionArgOverrides);
  const eventEnabledOverrides = asObj(cfg.eventEnabledOverrides);
  const eventDefaultOverrides = asObj(cfg.eventDefaultOverrides);
  const windowEnabledOverrides = asObj(cfg.windowEnabledOverrides);
  const windowDefaultOverrides = asObj(cfg.windowDefaultOverrides);
  const signalDefinitionCollisions = Array.isArray(cfg.signalDefinitionCollisions)
    ? cfg.signalDefinitionCollisions
    : [];
  const knownTopLevelKeys = new Set(Object.keys(asObj(DEFAULT_MASTER_CONTROL)));
  const knownExecutionKeys = new Set(Object.keys(asObj(DEFAULT_MASTER_CONTROL && DEFAULT_MASTER_CONTROL.execution)));

  const errors = [];
  for (const key of Object.keys(cfg)) {
    if (knownTopLevelKeys.has(key)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL contains unknown top-level key: ${key}`);
  }
  if (!asText(cfg.id)) errors.push("RULE_ENGINE_MASTER_CONTROL.id is required");
  if (!asText(cfg.version)) errors.push("RULE_ENGINE_MASTER_CONTROL.version is required");
  if (Object.prototype.hasOwnProperty.call(cfg, "enabled") && typeof cfg.enabled !== "boolean") {
    errors.push("RULE_ENGINE_MASTER_CONTROL.enabled must be boolean when present");
  }
  for (const rawId of signalDefinitionCollisions) {
    const id = asText(rawId).toLowerCase();
    if (!id) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalDefinitionCollisions contains empty signal id");
      continue;
    }
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalDefinitionCollisions duplicate signal id: ${id}`);
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "execution")) {
    if (!cfg.execution || typeof cfg.execution !== "object" || Array.isArray(cfg.execution)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.execution must be an object when present");
    } else if (Object.prototype.hasOwnProperty.call(execution, "stopOnFirstMatch")) {
      if (typeof execution.stopOnFirstMatch !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.stopOnFirstMatch must be boolean when present");
      }
    }
    if (cfg.execution && typeof cfg.execution === "object" && !Array.isArray(cfg.execution)) {
      for (const key of Object.keys(cfg.execution)) {
        if (knownExecutionKeys.has(key)) continue;
        errors.push(`RULE_ENGINE_MASTER_CONTROL.execution contains unknown key: ${key}`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxMatchesPerSignal")) {
      const n = Number(execution.maxMatchesPerSignal);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxMatchesPerSignal must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxActionsPerSignal")) {
      const n = Number(execution.maxActionsPerSignal);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxActionsPerSignal must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxRulesEvaluatedPerSignal")) {
      const n = Number(execution.maxRulesEvaluatedPerSignal);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxRulesEvaluatedPerSignal must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxRulesEvaluatedPerEvent")) {
      const n = Number(execution.maxRulesEvaluatedPerEvent);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxRulesEvaluatedPerEvent must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxSignalsPerEvent")) {
      const n = Number(execution.maxSignalsPerEvent);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxSignalsPerEvent must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxSignalsEvaluatedPerEvent")) {
      const n = Number(execution.maxSignalsEvaluatedPerEvent);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxSignalsEvaluatedPerEvent must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxMatchesPerEvent")) {
      const n = Number(execution.maxMatchesPerEvent);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxMatchesPerEvent must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxActionsPerEvent")) {
      const n = Number(execution.maxActionsPerEvent);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxActionsPerEvent must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxActionsPerRuleMatch")) {
      const n = Number(execution.maxActionsPerRuleMatch);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.maxActionsPerRuleMatch must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "sourceEventDebounceMs")) {
      const n = Number(execution.sourceEventDebounceMs);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.sourceEventDebounceMs must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "emitPreviewMatchedEvents")) {
      if (typeof execution.emitPreviewMatchedEvents !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.emitPreviewMatchedEvents must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "emitActionExecutedEvents")) {
      if (typeof execution.emitActionExecutedEvents !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.emitActionExecutedEvents must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "emitSourceEventSummaryEvents")) {
      if (typeof execution.emitSourceEventSummaryEvents !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.emitSourceEventSummaryEvents must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "sourceEventSummaryIncludeSignalAndRuleIds")) {
      if (typeof execution.sourceEventSummaryIncludeSignalAndRuleIds !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.sourceEventSummaryIncludeSignalAndRuleIds must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "sourceEventSummaryIncludeBudgetCaps")) {
      if (typeof execution.sourceEventSummaryIncludeBudgetCaps !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.sourceEventSummaryIncludeBudgetCaps must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "actionExecutedEventTypeEnabled")) {
      const actionExecutedEventTypeEnabled = execution.actionExecutedEventTypeEnabled;
      if (!actionExecutedEventTypeEnabled || typeof actionExecutedEventTypeEnabled !== "object" || Array.isArray(actionExecutedEventTypeEnabled)) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.actionExecutedEventTypeEnabled must be an object when present");
      } else {
        const allowed = new Set(["wake_win", "event"]);
        for (const [k, v] of Object.entries(actionExecutedEventTypeEnabled)) {
          if (!allowed.has(String(k || "").trim().toLowerCase())) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.execution.actionExecutedEventTypeEnabled has unsupported key: ${k}`);
            continue;
          }
          if (typeof v !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.execution.actionExecutedEventTypeEnabled[${k}] must be boolean`);
          }
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "executeActions")) {
      if (typeof execution.executeActions !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.executeActions must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "actionTypeEnabled")) {
      const actionTypeEnabled = execution.actionTypeEnabled;
      if (!actionTypeEnabled || typeof actionTypeEnabled !== "object" || Array.isArray(actionTypeEnabled)) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.actionTypeEnabled must be an object when present");
      } else {
        const allowed = new Set(["wake_win", "event"]);
        for (const [k, v] of Object.entries(actionTypeEnabled)) {
          if (!allowed.has(String(k || "").trim().toLowerCase())) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.execution.actionTypeEnabled has unsupported key: ${k}`);
            continue;
          }
          if (typeof v !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.execution.actionTypeEnabled[${k}] must be boolean`);
          }
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "cooldownScale")) {
      const n = Number(execution.cooldownScale);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.cooldownScale must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "matchWindowScale")) {
      const n = Number(execution.matchWindowScale);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.matchWindowScale must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "signalDebounceMs")) {
      const n = Number(execution.signalDebounceMs);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.signalDebounceMs must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "stopOnFirstSignalMatchPerEvent")) {
      if (typeof execution.stopOnFirstSignalMatchPerEvent !== "boolean") {
        errors.push("RULE_ENGINE_MASTER_CONTROL.execution.stopOnFirstSignalMatchPerEvent must be boolean when present");
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleDefaults")) {
    if (!cfg.ruleDefaults || typeof cfg.ruleDefaults !== "object" || Array.isArray(cfg.ruleDefaults)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleDefaults must be an object when present");
    } else {
      const allowedRuleDefaultKeys = new Set(["cooldownMs", "matchWindowMs", "priority"]);
      for (const key of Object.keys(ruleDefaults)) {
        if (allowedRuleDefaultKeys.has(String(key || ""))) continue;
        errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleDefaults contains unknown key: ${key}`);
      }
      if (Object.prototype.hasOwnProperty.call(ruleDefaults, "cooldownMs")) {
        const n = Number(ruleDefaults.cooldownMs);
        if (!Number.isFinite(n) || n < 0) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleDefaults.cooldownMs must be a finite number >= 0");
        }
      }
      if (Object.prototype.hasOwnProperty.call(ruleDefaults, "matchWindowMs")) {
        const n = Number(ruleDefaults.matchWindowMs);
        if (!Number.isFinite(n) || n < 100) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleDefaults.matchWindowMs must be a finite number >= 100");
        }
      }
      if (Object.prototype.hasOwnProperty.call(ruleDefaults, "priority")) {
        const n = Number(ruleDefaults.priority);
        if (!Number.isFinite(n)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleDefaults.priority must be a finite number");
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "rulePriorityOverrides")) {
    if (!cfg.rulePriorityOverrides || typeof cfg.rulePriorityOverrides !== "object" || Array.isArray(cfg.rulePriorityOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.rulePriorityOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(rulePriorityOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.rulePriorityOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.rulePriorityOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (!Number.isFinite(Number(value))) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.rulePriorityOverrides[${ruleId}] must be a finite number`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleTimingOverrides")) {
    if (!cfg.ruleTimingOverrides || typeof cfg.ruleTimingOverrides !== "object" || Array.isArray(cfg.ruleTimingOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleTimingOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides[${ruleId}] must be an object`);
          continue;
        }
        const allowedTimingKeys = new Set(["cooldownMs", "matchWindowMs"]);
        for (const key of Object.keys(value)) {
          if (allowedTimingKeys.has(String(key || ""))) continue;
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides[${ruleId}] contains unknown key: ${key}`);
        }
        if (Object.prototype.hasOwnProperty.call(value, "cooldownMs")) {
          const n = Number(value.cooldownMs);
          if (!Number.isFinite(n) || n < 0) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides[${ruleId}].cooldownMs must be a finite number >= 0`);
          }
        }
        if (Object.prototype.hasOwnProperty.call(value, "matchWindowMs")) {
          const n = Number(value.matchWindowMs);
          if (!Number.isFinite(n) || n < 100) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides[${ruleId}].matchWindowMs must be a finite number >= 100`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleActionLimitOverrides")) {
    if (!cfg.ruleActionLimitOverrides || typeof cfg.ruleActionLimitOverrides !== "object" || Array.isArray(cfg.ruleActionLimitOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleActionLimitOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleActionLimitOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleActionLimitOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionLimitOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionLimitOverrides[${ruleId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleCooldownScaleOverrides")) {
    if (!cfg.ruleCooldownScaleOverrides || typeof cfg.ruleCooldownScaleOverrides !== "object" || Array.isArray(cfg.ruleCooldownScaleOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleCooldownScaleOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleCooldownScaleOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleCooldownScaleOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleCooldownScaleOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleCooldownScaleOverrides[${ruleId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleMatchWindowScaleOverrides")) {
    if (!cfg.ruleMatchWindowScaleOverrides || typeof cfg.ruleMatchWindowScaleOverrides !== "object" || Array.isArray(cfg.ruleMatchWindowScaleOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleMatchWindowScaleOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleMatchWindowScaleOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleMatchWindowScaleOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleMatchWindowScaleOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleMatchWindowScaleOverrides[${ruleId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleEmitPreviewMatchedOverrides")) {
    if (!cfg.ruleEmitPreviewMatchedOverrides || typeof cfg.ruleEmitPreviewMatchedOverrides !== "object" || Array.isArray(cfg.ruleEmitPreviewMatchedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleEmitPreviewMatchedOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleEmitActionExecutedOverrides")) {
    if (!cfg.ruleEmitActionExecutedOverrides || typeof cfg.ruleEmitActionExecutedOverrides !== "object" || Array.isArray(cfg.ruleEmitActionExecutedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEmitActionExecutedOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleEmitActionExecutedOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEmitActionExecutedOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitActionExecutedOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitActionExecutedOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleEmitSourceEventSummaryOverrides")) {
    if (!cfg.ruleEmitSourceEventSummaryOverrides || typeof cfg.ruleEmitSourceEventSummaryOverrides !== "object" || Array.isArray(cfg.ruleEmitSourceEventSummaryOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEmitSourceEventSummaryOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleEmitSourceEventSummaryOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEmitSourceEventSummaryOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitSourceEventSummaryOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitSourceEventSummaryOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleSummaryIncludeSignalAndRuleIdsOverrides")) {
    if (!cfg.ruleSummaryIncludeSignalAndRuleIdsOverrides || typeof cfg.ruleSummaryIncludeSignalAndRuleIdsOverrides !== "object" || Array.isArray(cfg.ruleSummaryIncludeSignalAndRuleIdsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeSignalAndRuleIdsOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleSummaryIncludeSignalAndRuleIdsOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeSignalAndRuleIdsOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeSignalAndRuleIdsOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeSignalAndRuleIdsOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleSummaryIncludeBudgetCapsOverrides")) {
    if (!cfg.ruleSummaryIncludeBudgetCapsOverrides || typeof cfg.ruleSummaryIncludeBudgetCapsOverrides !== "object" || Array.isArray(cfg.ruleSummaryIncludeBudgetCapsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeBudgetCapsOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleSummaryIncludeBudgetCapsOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeBudgetCapsOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeBudgetCapsOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeBudgetCapsOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleActionExecutedEventTypeEnabledOverrides")) {
    if (!cfg.ruleActionExecutedEventTypeEnabledOverrides || typeof cfg.ruleActionExecutedEventTypeEnabledOverrides !== "object" || Array.isArray(cfg.ruleActionExecutedEventTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [ruleId, value] of Object.entries(ruleActionExecutedEventTypeEnabledOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides[${ruleId}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          if (!String(actionType || "").trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides[${ruleId}] contains empty action type key`);
            continue;
          }
          if (actionType !== String(actionType).trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides[${ruleId}] key must not include leading/trailing whitespace: ${actionType}`);
          }
          const key = String(actionType || "").trim().toLowerCase();
          if (String(actionType) !== key) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides[${ruleId}] action type key must be canonical lowercase: ${actionType}`);
          }
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides[${ruleId}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides[${ruleId}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleExecuteActionsOverrides")) {
    if (!cfg.ruleExecuteActionsOverrides || typeof cfg.ruleExecuteActionsOverrides !== "object" || Array.isArray(cfg.ruleExecuteActionsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleExecuteActionsOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleExecuteActionsOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleExecuteActionsOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleExecuteActionsOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleExecuteActionsOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleActionTypeEnabledOverrides")) {
    if (!cfg.ruleActionTypeEnabledOverrides || typeof cfg.ruleActionTypeEnabledOverrides !== "object" || Array.isArray(cfg.ruleActionTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [ruleId, value] of Object.entries(ruleActionTypeEnabledOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          if (!String(actionType || "").trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] contains empty action type key`);
            continue;
          }
          if (actionType !== String(actionType).trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] key must not include leading/trailing whitespace: ${actionType}`);
          }
          const key = String(actionType || "").trim().toLowerCase();
          if (String(actionType) !== key) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] action type key must be canonical lowercase: ${actionType}`);
          }
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalEnabledOverrides")) {
    if (!cfg.signalEnabledOverrides || typeof cfg.signalEnabledOverrides !== "object" || Array.isArray(cfg.signalEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalEnabledOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalEnabledOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalEnabledOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEnabledOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEnabledOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalDebounceOverrides")) {
    if (!cfg.signalDebounceOverrides || typeof cfg.signalDebounceOverrides !== "object" || Array.isArray(cfg.signalDebounceOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalDebounceOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalDebounceOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalDebounceOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalDebounceOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalDebounceOverrides[${signalId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxMatchesOverrides")) {
    if (!cfg.signalMaxMatchesOverrides || typeof cfg.signalMaxMatchesOverrides !== "object" || Array.isArray(cfg.signalMaxMatchesOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxMatchesOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalStopOnFirstMatchOverrides")) {
    if (!cfg.signalStopOnFirstMatchOverrides || typeof cfg.signalStopOnFirstMatchOverrides !== "object" || Array.isArray(cfg.signalStopOnFirstMatchOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstMatchOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalStopOnFirstMatchOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstMatchOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstMatchOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstMatchOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalEmitPreviewMatchedOverrides")) {
    if (!cfg.signalEmitPreviewMatchedOverrides || typeof cfg.signalEmitPreviewMatchedOverrides !== "object" || Array.isArray(cfg.signalEmitPreviewMatchedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalEmitPreviewMatchedOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalEmitPreviewMatchedOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalEmitPreviewMatchedOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitPreviewMatchedOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitPreviewMatchedOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalExecuteActionsOverrides")) {
    if (!cfg.signalExecuteActionsOverrides || typeof cfg.signalExecuteActionsOverrides !== "object" || Array.isArray(cfg.signalExecuteActionsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalExecuteActionsOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalExecuteActionsOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalExecuteActionsOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalExecuteActionsOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalExecuteActionsOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalActionTypeEnabledOverrides")) {
    if (!cfg.signalActionTypeEnabledOverrides || typeof cfg.signalActionTypeEnabledOverrides !== "object" || Array.isArray(cfg.signalActionTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [signalId, value] of Object.entries(signalActionTypeEnabledOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides[${signalId}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          if (!String(actionType || "").trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides[${signalId}] contains empty action type key`);
            continue;
          }
          if (actionType !== String(actionType).trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides[${signalId}] key must not include leading/trailing whitespace: ${actionType}`);
          }
          const key = String(actionType || "").trim().toLowerCase();
          if (String(actionType) !== key) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides[${signalId}] action type key must be canonical lowercase: ${actionType}`);
          }
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides[${signalId}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides[${signalId}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMatchWindowScaleOverrides")) {
    if (!cfg.signalMatchWindowScaleOverrides || typeof cfg.signalMatchWindowScaleOverrides !== "object" || Array.isArray(cfg.signalMatchWindowScaleOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMatchWindowScaleOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMatchWindowScaleOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMatchWindowScaleOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMatchWindowScaleOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMatchWindowScaleOverrides[${signalId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalCooldownScaleOverrides")) {
    if (!cfg.signalCooldownScaleOverrides || typeof cfg.signalCooldownScaleOverrides !== "object" || Array.isArray(cfg.signalCooldownScaleOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalCooldownScaleOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalCooldownScaleOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalCooldownScaleOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalCooldownScaleOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalCooldownScaleOverrides[${signalId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxActionsPerRuleMatchOverrides")) {
    if (!cfg.signalMaxActionsPerRuleMatchOverrides || typeof cfg.signalMaxActionsPerRuleMatchOverrides !== "object" || Array.isArray(cfg.signalMaxActionsPerRuleMatchOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerRuleMatchOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxActionsPerRuleMatchOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerRuleMatchOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerRuleMatchOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerRuleMatchOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxRulesEvaluatedOverrides")) {
    if (!cfg.signalMaxRulesEvaluatedOverrides || typeof cfg.signalMaxRulesEvaluatedOverrides !== "object" || Array.isArray(cfg.signalMaxRulesEvaluatedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxRulesEvaluatedOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxActionsPerEventOverrides")) {
    if (!cfg.signalMaxActionsPerEventOverrides || typeof cfg.signalMaxActionsPerEventOverrides !== "object" || Array.isArray(cfg.signalMaxActionsPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxActionsPerEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerEventOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxActionsPerSignalOverrides")) {
    if (!cfg.signalMaxActionsPerSignalOverrides || typeof cfg.signalMaxActionsPerSignalOverrides !== "object" || Array.isArray(cfg.signalMaxActionsPerSignalOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerSignalOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxActionsPerSignalOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerSignalOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerSignalOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerSignalOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalEmitActionExecutedOverrides")) {
    if (!cfg.signalEmitActionExecutedOverrides || typeof cfg.signalEmitActionExecutedOverrides !== "object" || Array.isArray(cfg.signalEmitActionExecutedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalEmitActionExecutedOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalEmitActionExecutedOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalEmitActionExecutedOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitActionExecutedOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitActionExecutedOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalEmitSourceEventSummaryOverrides")) {
    if (!cfg.signalEmitSourceEventSummaryOverrides || typeof cfg.signalEmitSourceEventSummaryOverrides !== "object" || Array.isArray(cfg.signalEmitSourceEventSummaryOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalEmitSourceEventSummaryOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalEmitSourceEventSummaryOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalEmitSourceEventSummaryOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitSourceEventSummaryOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitSourceEventSummaryOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalSummaryIncludeSignalAndRuleIdsOverrides")) {
    if (!cfg.signalSummaryIncludeSignalAndRuleIdsOverrides || typeof cfg.signalSummaryIncludeSignalAndRuleIdsOverrides !== "object" || Array.isArray(cfg.signalSummaryIncludeSignalAndRuleIdsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeSignalAndRuleIdsOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalSummaryIncludeSignalAndRuleIdsOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeSignalAndRuleIdsOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeSignalAndRuleIdsOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeSignalAndRuleIdsOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalSummaryIncludeBudgetCapsOverrides")) {
    if (!cfg.signalSummaryIncludeBudgetCapsOverrides || typeof cfg.signalSummaryIncludeBudgetCapsOverrides !== "object" || Array.isArray(cfg.signalSummaryIncludeBudgetCapsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeBudgetCapsOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalSummaryIncludeBudgetCapsOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeBudgetCapsOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeBudgetCapsOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeBudgetCapsOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalActionExecutedEventTypeEnabledOverrides")) {
    if (!cfg.signalActionExecutedEventTypeEnabledOverrides || typeof cfg.signalActionExecutedEventTypeEnabledOverrides !== "object" || Array.isArray(cfg.signalActionExecutedEventTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [signalId, value] of Object.entries(signalActionExecutedEventTypeEnabledOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides[${signalId}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          if (!String(actionType || "").trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides[${signalId}] contains empty action type key`);
            continue;
          }
          if (actionType !== String(actionType).trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides[${signalId}] key must not include leading/trailing whitespace: ${actionType}`);
          }
          const key = String(actionType || "").trim().toLowerCase();
          if (String(actionType) !== key) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides[${signalId}] action type key must be canonical lowercase: ${actionType}`);
          }
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides[${signalId}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides[${signalId}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxMatchesPerEventOverrides")) {
    if (!cfg.signalMaxMatchesPerEventOverrides || typeof cfg.signalMaxMatchesPerEventOverrides !== "object" || Array.isArray(cfg.signalMaxMatchesPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesPerEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxMatchesPerEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesPerEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesPerEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesPerEventOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxSignalsPerEventOverrides")) {
    if (!cfg.signalMaxSignalsPerEventOverrides || typeof cfg.signalMaxSignalsPerEventOverrides !== "object" || Array.isArray(cfg.signalMaxSignalsPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsPerEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxSignalsPerEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsPerEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsPerEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsPerEventOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxSignalsEvaluatedPerEventOverrides")) {
    if (!cfg.signalMaxSignalsEvaluatedPerEventOverrides || typeof cfg.signalMaxSignalsEvaluatedPerEventOverrides !== "object" || Array.isArray(cfg.signalMaxSignalsEvaluatedPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsEvaluatedPerEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxSignalsEvaluatedPerEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsEvaluatedPerEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsEvaluatedPerEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsEvaluatedPerEventOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxRulesEvaluatedPerEventOverrides")) {
    if (!cfg.signalMaxRulesEvaluatedPerEventOverrides || typeof cfg.signalMaxRulesEvaluatedPerEventOverrides !== "object" || Array.isArray(cfg.signalMaxRulesEvaluatedPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedPerEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxRulesEvaluatedPerEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedPerEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedPerEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedPerEventOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalStopOnFirstSignalMatchPerEventOverrides")) {
    if (!cfg.signalStopOnFirstSignalMatchPerEventOverrides || typeof cfg.signalStopOnFirstSignalMatchPerEventOverrides !== "object" || Array.isArray(cfg.signalStopOnFirstSignalMatchPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstSignalMatchPerEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalStopOnFirstSignalMatchPerEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstSignalMatchPerEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstSignalMatchPerEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstSignalMatchPerEventOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalPriorityOverrides")) {
    if (!cfg.signalPriorityOverrides || typeof cfg.signalPriorityOverrides !== "object" || Array.isArray(cfg.signalPriorityOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalPriorityOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalPriorityOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalPriorityOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalPriorityOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (!Number.isFinite(Number(value))) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalPriorityOverrides[${signalId}] must be a finite number`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalSourceEventOverrides")) {
    if (!cfg.signalSourceEventOverrides || typeof cfg.signalSourceEventOverrides !== "object" || Array.isArray(cfg.signalSourceEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalSourceEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalSourceEventOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalSourceEventOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSourceEventOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (typeof value !== "string") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSourceEventOverrides[${signalId}] must be a string`);
        }
        if (!asText(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSourceEventOverrides[${signalId}] must be a non-empty source event string`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalWhereOverrides")) {
    if (!cfg.signalWhereOverrides || typeof cfg.signalWhereOverrides !== "object" || Array.isArray(cfg.signalWhereOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalWhereOverrides)) {
        if (!asText(signalId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides contains empty signal id key");
          continue;
        }
        if (signalId !== String(signalId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides key must not include leading/trailing whitespace: ${signalId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] must be an object`);
          continue;
        }
        const allowedWhereKeys = new Set(["path", "eq", "gt", "gte", "lt", "lte"]);
        for (const key of Object.keys(value)) {
          if (allowedWhereKeys.has(String(key || ""))) continue;
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] contains unknown key: ${key}`);
        }
        const hasPath = Object.prototype.hasOwnProperty.call(value, "path");
        if (!hasPath) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].path is required`);
        }
        if (hasPath && typeof value.path !== "string") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].path must be a string when present`);
        }
        if (hasPath && !asText(value.path)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].path must be non-empty when present`);
        }
        const hasEq = Object.prototype.hasOwnProperty.call(value, "eq");
        const hasGt = Object.prototype.hasOwnProperty.call(value, "gt");
        const hasGte = Object.prototype.hasOwnProperty.call(value, "gte");
        const hasLt = Object.prototype.hasOwnProperty.call(value, "lt");
        const hasLte = Object.prototype.hasOwnProperty.call(value, "lte");
        if (!hasEq && !hasGt && !hasGte && !hasLt && !hasLte) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] must include at least one comparator (eq|gt|gte|lt|lte)`);
        }
        if (hasEq && (hasGt || hasGte || hasLt || hasLte)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] cannot combine eq with numeric comparators`);
        }
        if (hasEq && value.eq === undefined) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].eq must not be undefined`);
        }
        if (hasGt && hasGte) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] cannot combine gt and gte`);
        }
        if (hasLt && hasLte) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] cannot combine lt and lte`);
        }
        if (hasGt && !isFiniteNumber(value.gt)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].gt must be a finite number`);
        }
        if (hasGte && !isFiniteNumber(value.gte)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].gte must be a finite number`);
        }
        if (hasLt && !isFiniteNumber(value.lt)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].lt must be a finite number`);
        }
        if (hasLte && !isFiniteNumber(value.lte)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}].lte must be a finite number`);
        }
        const lower = hasGt
          ? Number(value.gt)
          : (hasGte ? Number(value.gte) : null);
        const upper = hasLt
          ? Number(value.lt)
          : (hasLte ? Number(value.lte) : null);
        if (lower !== null && upper !== null && Number.isFinite(lower) && Number.isFinite(upper) && lower > upper) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides[${signalId}] lower bound cannot be greater than upper bound`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventEnabledOverrides")) {
    if (!cfg.sourceEventEnabledOverrides || typeof cfg.sourceEventEnabledOverrides !== "object" || Array.isArray(cfg.sourceEventEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEnabledOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventEnabledOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEnabledOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEnabledOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEnabledOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventDebounceOverrides")) {
    if (!cfg.sourceEventDebounceOverrides || typeof cfg.sourceEventDebounceOverrides !== "object" || Array.isArray(cfg.sourceEventDebounceOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventDebounceOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventDebounceOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventDebounceOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventDebounceOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventDebounceOverrides[${sourceEvent}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxSignalsOverrides")) {
    if (!cfg.sourceEventMaxSignalsOverrides || typeof cfg.sourceEventMaxSignalsOverrides !== "object" || Array.isArray(cfg.sourceEventMaxSignalsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxSignalsOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxSignalsEvaluatedPerEventOverrides")) {
    if (!cfg.sourceEventMaxSignalsEvaluatedPerEventOverrides || typeof cfg.sourceEventMaxSignalsEvaluatedPerEventOverrides !== "object" || Array.isArray(cfg.sourceEventMaxSignalsEvaluatedPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsEvaluatedPerEventOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxSignalsEvaluatedPerEventOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsEvaluatedPerEventOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsEvaluatedPerEventOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsEvaluatedPerEventOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxActionsPerSignalOverrides")) {
    if (!cfg.sourceEventMaxActionsPerSignalOverrides || typeof cfg.sourceEventMaxActionsPerSignalOverrides !== "object" || Array.isArray(cfg.sourceEventMaxActionsPerSignalOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerSignalOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxActionsPerSignalOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerSignalOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerSignalOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerSignalOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxRulesEvaluatedOverrides")) {
    if (!cfg.sourceEventMaxRulesEvaluatedOverrides || typeof cfg.sourceEventMaxRulesEvaluatedOverrides !== "object" || Array.isArray(cfg.sourceEventMaxRulesEvaluatedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxRulesEvaluatedOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxRulesEvaluatedPerEventOverrides")) {
    if (!cfg.sourceEventMaxRulesEvaluatedPerEventOverrides || typeof cfg.sourceEventMaxRulesEvaluatedPerEventOverrides !== "object" || Array.isArray(cfg.sourceEventMaxRulesEvaluatedPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedPerEventOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxRulesEvaluatedPerEventOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedPerEventOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedPerEventOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedPerEventOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxMatchesPerEventOverrides")) {
    if (!cfg.sourceEventMaxMatchesPerEventOverrides || typeof cfg.sourceEventMaxMatchesPerEventOverrides !== "object" || Array.isArray(cfg.sourceEventMaxMatchesPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerEventOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxMatchesPerEventOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerEventOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerEventOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerEventOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxActionsPerEventOverrides")) {
    if (!cfg.sourceEventMaxActionsPerEventOverrides || typeof cfg.sourceEventMaxActionsPerEventOverrides !== "object" || Array.isArray(cfg.sourceEventMaxActionsPerEventOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerEventOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxActionsPerEventOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerEventOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerEventOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerEventOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventStopOnFirstSignalMatchOverrides")) {
    if (!cfg.sourceEventStopOnFirstSignalMatchOverrides || typeof cfg.sourceEventStopOnFirstSignalMatchOverrides !== "object" || Array.isArray(cfg.sourceEventStopOnFirstSignalMatchOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventStopOnFirstSignalMatchOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventEmitPreviewMatchedOverrides")) {
    if (!cfg.sourceEventEmitPreviewMatchedOverrides || typeof cfg.sourceEventEmitPreviewMatchedOverrides !== "object" || Array.isArray(cfg.sourceEventEmitPreviewMatchedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventEmitPreviewMatchedOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventEmitActionExecutedOverrides")) {
    if (!cfg.sourceEventEmitActionExecutedOverrides || typeof cfg.sourceEventEmitActionExecutedOverrides !== "object" || Array.isArray(cfg.sourceEventEmitActionExecutedOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEmitActionExecutedOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventEmitActionExecutedOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEmitActionExecutedOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitActionExecutedOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitActionExecutedOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventActionTypeEnabledOverrides")) {
    if (!cfg.sourceEventActionTypeEnabledOverrides || typeof cfg.sourceEventActionTypeEnabledOverrides !== "object" || Array.isArray(cfg.sourceEventActionTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [sourceEvent, value] of Object.entries(sourceEventActionTypeEnabledOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          if (!String(actionType || "").trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] contains empty action type key`);
            continue;
          }
          if (actionType !== String(actionType).trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] key must not include leading/trailing whitespace: ${actionType}`);
          }
          const key = String(actionType || "").trim().toLowerCase();
          if (String(actionType) !== key) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] action type key must be canonical lowercase: ${actionType}`);
          }
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventEmitSourceEventSummaryOverrides")) {
    if (!cfg.sourceEventEmitSourceEventSummaryOverrides || typeof cfg.sourceEventEmitSourceEventSummaryOverrides !== "object" || Array.isArray(cfg.sourceEventEmitSourceEventSummaryOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEmitSourceEventSummaryOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventEmitSourceEventSummaryOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventEmitSourceEventSummaryOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitSourceEventSummaryOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitSourceEventSummaryOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventSummaryIncludeSignalAndRuleIdsOverrides")) {
    if (!cfg.sourceEventSummaryIncludeSignalAndRuleIdsOverrides || typeof cfg.sourceEventSummaryIncludeSignalAndRuleIdsOverrides !== "object" || Array.isArray(cfg.sourceEventSummaryIncludeSignalAndRuleIdsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeSignalAndRuleIdsOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventSummaryIncludeSignalAndRuleIdsOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeSignalAndRuleIdsOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeSignalAndRuleIdsOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeSignalAndRuleIdsOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventSummaryIncludeBudgetCapsOverrides")) {
    if (!cfg.sourceEventSummaryIncludeBudgetCapsOverrides || typeof cfg.sourceEventSummaryIncludeBudgetCapsOverrides !== "object" || Array.isArray(cfg.sourceEventSummaryIncludeBudgetCapsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeBudgetCapsOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventSummaryIncludeBudgetCapsOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeBudgetCapsOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeBudgetCapsOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeBudgetCapsOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventActionExecutedEventTypeEnabledOverrides")) {
    if (!cfg.sourceEventActionExecutedEventTypeEnabledOverrides || typeof cfg.sourceEventActionExecutedEventTypeEnabledOverrides !== "object" || Array.isArray(cfg.sourceEventActionExecutedEventTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [sourceEvent, value] of Object.entries(sourceEventActionExecutedEventTypeEnabledOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides[${sourceEvent}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          if (!String(actionType || "").trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides[${sourceEvent}] contains empty action type key`);
            continue;
          }
          if (actionType !== String(actionType).trim()) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides[${sourceEvent}] key must not include leading/trailing whitespace: ${actionType}`);
          }
          const key = String(actionType || "").trim().toLowerCase();
          if (String(actionType) !== key) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides[${sourceEvent}] action type key must be canonical lowercase: ${actionType}`);
          }
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides[${sourceEvent}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides[${sourceEvent}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventExecuteActionsOverrides")) {
    if (!cfg.sourceEventExecuteActionsOverrides || typeof cfg.sourceEventExecuteActionsOverrides !== "object" || Array.isArray(cfg.sourceEventExecuteActionsOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventExecuteActionsOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventExecuteActionsOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventExecuteActionsOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventExecuteActionsOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventExecuteActionsOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventCooldownScaleOverrides")) {
    if (!cfg.sourceEventCooldownScaleOverrides || typeof cfg.sourceEventCooldownScaleOverrides !== "object" || Array.isArray(cfg.sourceEventCooldownScaleOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventCooldownScaleOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventCooldownScaleOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventCooldownScaleOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventCooldownScaleOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventCooldownScaleOverrides[${sourceEvent}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMatchWindowScaleOverrides")) {
    if (!cfg.sourceEventMatchWindowScaleOverrides || typeof cfg.sourceEventMatchWindowScaleOverrides !== "object" || Array.isArray(cfg.sourceEventMatchWindowScaleOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMatchWindowScaleOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides[${sourceEvent}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxActionsPerRuleMatchOverrides")) {
    if (!cfg.sourceEventMaxActionsPerRuleMatchOverrides || typeof cfg.sourceEventMaxActionsPerRuleMatchOverrides !== "object" || Array.isArray(cfg.sourceEventMaxActionsPerRuleMatchOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxActionsPerRuleMatchOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventStopOnFirstMatchOverrides")) {
    if (!cfg.sourceEventStopOnFirstMatchOverrides || typeof cfg.sourceEventStopOnFirstMatchOverrides !== "object" || Array.isArray(cfg.sourceEventStopOnFirstMatchOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventStopOnFirstMatchOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxMatchesPerSignalOverrides")) {
    if (!cfg.sourceEventMaxMatchesPerSignalOverrides || typeof cfg.sourceEventMaxMatchesPerSignalOverrides !== "object" || Array.isArray(cfg.sourceEventMaxMatchesPerSignalOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxMatchesPerSignalOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides contains empty source event key");
          continue;
        }
        if (sourceEvent !== String(sourceEvent).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides key must not include leading/trailing whitespace: ${sourceEvent}`);
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleEnabledOverrides")) {
    if (!cfg.ruleEnabledOverrides || typeof cfg.ruleEnabledOverrides !== "object" || Array.isArray(cfg.ruleEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEnabledOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleEnabledOverrides)) {
        if (!asText(ruleId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.ruleEnabledOverrides contains empty rule id key");
          continue;
        }
        if (ruleId !== String(ruleId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEnabledOverrides key must not include leading/trailing whitespace: ${ruleId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEnabledOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "actionEnabledOverrides")) {
    if (!cfg.actionEnabledOverrides || typeof cfg.actionEnabledOverrides !== "object" || Array.isArray(cfg.actionEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides must be an object when present");
    } else {
      for (const [actionKey, value] of Object.entries(actionEnabledOverrides)) {
        if (!asText(actionKey)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides contains empty action key");
          continue;
        }
        if (actionKey !== String(actionKey).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides key must not include leading/trailing whitespace: ${actionKey}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides[${actionKey}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "actionArgOverrides")) {
    if (!cfg.actionArgOverrides || typeof cfg.actionArgOverrides !== "object" || Array.isArray(cfg.actionArgOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.actionArgOverrides must be an object when present");
    } else {
      for (const [actionKey, value] of Object.entries(actionArgOverrides)) {
        if (!asText(actionKey)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.actionArgOverrides contains empty action key");
          continue;
        }
        if (actionKey !== String(actionKey).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.actionArgOverrides key must not include leading/trailing whitespace: ${actionKey}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.actionArgOverrides[${actionKey}] must be an object`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "eventEnabledOverrides")) {
    if (!cfg.eventEnabledOverrides || typeof cfg.eventEnabledOverrides !== "object" || Array.isArray(cfg.eventEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.eventEnabledOverrides must be an object when present");
    } else {
      for (const [eventId, value] of Object.entries(eventEnabledOverrides)) {
        if (!asText(eventId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.eventEnabledOverrides contains empty event id key");
          continue;
        }
        if (eventId !== String(eventId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.eventEnabledOverrides key must not include leading/trailing whitespace: ${eventId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.eventEnabledOverrides[${eventId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "eventDefaultOverrides")) {
    if (!cfg.eventDefaultOverrides || typeof cfg.eventDefaultOverrides !== "object" || Array.isArray(cfg.eventDefaultOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.eventDefaultOverrides must be an object when present");
    } else {
      for (const [eventId, value] of Object.entries(eventDefaultOverrides)) {
        if (!asText(eventId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.eventDefaultOverrides contains empty event id key");
          continue;
        }
        if (eventId !== String(eventId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.eventDefaultOverrides key must not include leading/trailing whitespace: ${eventId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.eventDefaultOverrides[${eventId}] must be an object`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "windowEnabledOverrides")) {
    if (!cfg.windowEnabledOverrides || typeof cfg.windowEnabledOverrides !== "object" || Array.isArray(cfg.windowEnabledOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.windowEnabledOverrides must be an object when present");
    } else {
      for (const [windowId, value] of Object.entries(windowEnabledOverrides)) {
        if (!asText(windowId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.windowEnabledOverrides contains empty window id key");
          continue;
        }
        if (windowId !== String(windowId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.windowEnabledOverrides key must not include leading/trailing whitespace: ${windowId}`);
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.windowEnabledOverrides[${windowId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "windowDefaultOverrides")) {
    if (!cfg.windowDefaultOverrides || typeof cfg.windowDefaultOverrides !== "object" || Array.isArray(cfg.windowDefaultOverrides)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.windowDefaultOverrides must be an object when present");
    } else {
      for (const [windowId, value] of Object.entries(windowDefaultOverrides)) {
        if (!asText(windowId)) {
          errors.push("RULE_ENGINE_MASTER_CONTROL.windowDefaultOverrides contains empty window id key");
          continue;
        }
        if (windowId !== String(windowId).trim()) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.windowDefaultOverrides key must not include leading/trailing whitespace: ${windowId}`);
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_MASTER_CONTROL.windowDefaultOverrides[${windowId}] must be an object`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "eventRuntimeBindings")) {
    if (!cfg.eventRuntimeBindings || typeof cfg.eventRuntimeBindings !== "object" || Array.isArray(cfg.eventRuntimeBindings)) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings must be an object when present");
    }
  }
  if (!Array.isArray(cfg.signals)) errors.push("RULE_ENGINE_MASTER_CONTROL.signals must be an array");
  if (!Array.isArray(cfg.windows)) errors.push("RULE_ENGINE_MASTER_CONTROL.windows must be an array");
  if (!Array.isArray(cfg.events)) errors.push("RULE_ENGINE_MASTER_CONTROL.events must be an array");
  if (!Array.isArray(cfg.rules)) errors.push("RULE_ENGINE_MASTER_CONTROL.rules must be an array");
  if (Array.isArray(cfg.rules) && cfg.rules.length > 0) {
    errors.push("RULE_ENGINE_MASTER_CONTROL.rules must remain empty; author rules in INTERACTIONS_V2");
  }

  const ruleErrors = validateSpellRules(rules, { signals, windows, events });
  errors.push(...ruleErrors);

  const eventIds = new Set(events.map((e) => String(e && e.id || "").trim().toLowerCase()).filter(Boolean));
  for (const eventId of Object.keys(eventEnabledOverrides)) {
    const id = String(eventId || "").trim().toLowerCase();
    if (!id || eventIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.eventEnabledOverrides references unknown event id: ${id}`);
  }
  for (const eventId of Object.keys(eventDefaultOverrides)) {
    const id = String(eventId || "").trim().toLowerCase();
    if (!id || eventIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.eventDefaultOverrides references unknown event id: ${id}`);
  }
  const windowIds = new Set(windows.map((w) => String(w && w.id || "").trim().toLowerCase()).filter(Boolean));
  for (const windowId of Object.keys(windowEnabledOverrides)) {
    const id = String(windowId || "").trim().toLowerCase();
    if (!id || windowIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.windowEnabledOverrides references unknown window id: ${id}`);
  }
  for (const windowId of Object.keys(windowDefaultOverrides)) {
    const id = String(windowId || "").trim().toLowerCase();
    if (!id || windowIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.windowDefaultOverrides references unknown window id: ${id}`);
  }
  const ruleIds = new Set(rules.map((r) => String(r && r.id || "").trim()).filter(Boolean));
  const signalIds = new Set(signals.map((s) => String(s && s.id || "").trim().toLowerCase()).filter(Boolean));
  for (const signalId of Object.keys(signalEnabledOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEnabledOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalDebounceOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalDebounceOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxMatchesOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalStopOnFirstMatchOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstMatchOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalEmitPreviewMatchedOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitPreviewMatchedOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalExecuteActionsOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalExecuteActionsOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalActionTypeEnabledOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionTypeEnabledOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMatchWindowScaleOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMatchWindowScaleOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalCooldownScaleOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalCooldownScaleOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxActionsPerRuleMatchOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerRuleMatchOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxRulesEvaluatedOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxActionsPerEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxActionsPerSignalOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxActionsPerSignalOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalEmitActionExecutedOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitActionExecutedOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalEmitSourceEventSummaryOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalEmitSourceEventSummaryOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalSummaryIncludeSignalAndRuleIdsOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeSignalAndRuleIdsOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalSummaryIncludeBudgetCapsOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSummaryIncludeBudgetCapsOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalActionExecutedEventTypeEnabledOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalActionExecutedEventTypeEnabledOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxMatchesPerEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxMatchesPerEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxSignalsPerEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsPerEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxSignalsEvaluatedPerEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxSignalsEvaluatedPerEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxRulesEvaluatedPerEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalMaxRulesEvaluatedPerEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalStopOnFirstSignalMatchPerEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalStopOnFirstSignalMatchPerEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalPriorityOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalPriorityOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalSourceEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalSourceEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalWhereOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.signalWhereOverrides references unknown signal id: ${id}`);
  }
  const sourceEvents = new Set(
    signals
      .map((s) => String(s && s.sourceEvent || "").trim())
      .filter(Boolean)
  );
  for (const sourceEvent of Object.keys(sourceEventEnabledOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEnabledOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventDebounceOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventDebounceOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxSignalsOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxSignalsEvaluatedPerEventOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxSignalsEvaluatedPerEventOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxActionsPerSignalOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerSignalOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxRulesEvaluatedOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxRulesEvaluatedPerEventOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxRulesEvaluatedPerEventOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxMatchesPerEventOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerEventOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxActionsPerEventOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerEventOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventStopOnFirstSignalMatchOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventEmitPreviewMatchedOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventEmitActionExecutedOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitActionExecutedOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventEmitSourceEventSummaryOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventEmitSourceEventSummaryOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventSummaryIncludeSignalAndRuleIdsOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeSignalAndRuleIdsOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventSummaryIncludeBudgetCapsOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventSummaryIncludeBudgetCapsOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventActionTypeEnabledOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventActionExecutedEventTypeEnabledOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventActionExecutedEventTypeEnabledOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventExecuteActionsOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventExecuteActionsOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventCooldownScaleOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventCooldownScaleOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMatchWindowScaleOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxActionsPerRuleMatchOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventStopOnFirstMatchOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxMatchesPerSignalOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides references unknown source event: ${evt}`);
  }
  for (const ruleId of Object.keys(ruleTimingOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleTimingOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleActionLimitOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionLimitOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleCooldownScaleOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleCooldownScaleOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleMatchWindowScaleOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleMatchWindowScaleOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleEmitPreviewMatchedOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleEmitActionExecutedOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitActionExecutedOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleEmitSourceEventSummaryOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEmitSourceEventSummaryOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleSummaryIncludeSignalAndRuleIdsOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeSignalAndRuleIdsOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleSummaryIncludeBudgetCapsOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleSummaryIncludeBudgetCapsOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleActionExecutedEventTypeEnabledOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionExecutedEventTypeEnabledOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleExecuteActionsOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleExecuteActionsOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleActionTypeEnabledOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleActionTypeEnabledOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(rulePriorityOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.rulePriorityOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleEnabledOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.ruleEnabledOverrides references unknown rule id: ${id}`);
  }
  for (const actionKey of Object.keys(actionArgOverrides)) {
    const key = String(actionKey || "").trim();
    if (!key) continue;
    const firstDot = key.indexOf(".");
    const ruleId = firstDot > 0 ? key.slice(0, firstDot) : key;
    if (!ruleId || ruleIds.has(ruleId)) continue;
    errors.push(`RULE_ENGINE_MASTER_CONTROL.actionArgOverrides references unknown rule id: ${ruleId}`);
  }
  const ruleById = rules.reduce((acc, rule) => {
    const id = String(rule && rule.id || "").trim();
    if (id) acc[id] = rule;
    return acc;
  }, Object.create(null));
  for (const actionKey of Object.keys(actionEnabledOverrides)) {
    const parsed = parseActionOverrideKey(actionKey);
    if (!parsed) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides has invalid key format: ${actionKey}`);
      continue;
    }
    const rule = ruleById[parsed.ruleId];
    if (!rule) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides references unknown rule id: ${parsed.ruleId}`);
      continue;
    }
    if (!actionOverrideKeyTargetsExistingAction(rule, parsed)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.actionEnabledOverrides references unknown action key: ${actionKey}`);
    }
  }
  for (const actionKey of Object.keys(actionArgOverrides)) {
    const parsed = parseActionOverrideKey(actionKey);
    if (!parsed) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.actionArgOverrides has invalid key format: ${actionKey}`);
      continue;
    }
    const rule = ruleById[parsed.ruleId];
    if (!rule) continue;
    if (!actionOverrideKeyTargetsExistingAction(rule, parsed)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.actionArgOverrides references unknown action key: ${actionKey}`);
    }
  }

  for (const eventDef of events) {
    const id = String(eventDef && eventDef.id || "").trim().toLowerCase();
    if (!id) continue;
    if (!Object.prototype.hasOwnProperty.call(eventRuntimeBindings, id)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings missing id: ${id}`);
    }
  }
  for (const bindingId of Object.keys(eventRuntimeBindings)) {
    const id = String(bindingId || "").trim().toLowerCase();
    const binding = eventRuntimeBindings[bindingId];
    if (!id) {
      errors.push("RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings contains empty event id key");
      continue;
    }
    if (bindingId !== String(bindingId).trim()) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings key must not include leading/trailing whitespace: ${bindingId}`);
    }
    if (!eventIds.has(id)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings references unknown event id: ${id}`);
      continue;
    }
    if (!binding || typeof binding !== "object" || Array.isArray(binding)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}] must be an object`);
      continue;
    }
    const allowedBindingKeys = new Set(["id", "runtime"]);
    for (const key of Object.keys(binding)) {
      if (!String(key || "").trim()) {
        errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}] contains empty key`);
        continue;
      }
      if (allowedBindingKeys.has(String(key || ""))) continue;
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}] contains unknown key: ${key}`);
    }
    const bindingInnerId = String(binding.id || "").trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(binding, "id") && typeof binding.id !== "string") {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].id must be a string`);
    }
    if (!bindingInnerId) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].id must be non-empty`);
    } else if (bindingInnerId !== id) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].id must match key (${id})`);
    }
    const runtime = (binding.runtime && typeof binding.runtime === "object" && !Array.isArray(binding.runtime))
      ? binding.runtime
      : null;
    if (!runtime) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime must be an object`);
      continue;
    }
    const allowedRuntimeKeys = new Set(["kind", "event", "castActionId"]);
    for (const key of Object.keys(runtime)) {
      if (!String(key || "").trim()) {
        errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime contains empty key`);
        continue;
      }
      if (allowedRuntimeKeys.has(String(key || ""))) continue;
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime contains unknown key: ${key}`);
    }
    if (Object.prototype.hasOwnProperty.call(runtime, "kind") && typeof runtime.kind !== "string") {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.kind must be a string when present`);
    }
    if (!asText(runtime.kind)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.kind is required`);
      continue;
    }
    const kind = String(runtime.kind || "").trim().toLowerCase();
    if (kind !== "orb_event" && kind !== "cast_action") {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.kind must be one of: orb_event, cast_action`);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(runtime, "event") && typeof runtime.event !== "string") {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.event must be a string when present`);
    }
    if (Object.prototype.hasOwnProperty.call(runtime, "castActionId") && typeof runtime.castActionId !== "string") {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.castActionId must be a string when present`);
    }
    if (kind === "orb_event" && !asText(runtime.event)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.event must be non-empty for kind orb_event`);
    }
    if (kind === "orb_event" && Object.prototype.hasOwnProperty.call(runtime, "castActionId") && asText(runtime.castActionId)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.castActionId must be omitted for kind orb_event`);
    }
    if (kind === "cast_action" && !asText(runtime.castActionId)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.castActionId must be non-empty for kind cast_action`);
    }
    if (kind === "cast_action" && Object.prototype.hasOwnProperty.call(runtime, "event") && asText(runtime.event)) {
      errors.push(`RULE_ENGINE_MASTER_CONTROL.eventRuntimeBindings[${id}].runtime.event must be omitted for kind cast_action`);
    }
  }

  return errors;
}
