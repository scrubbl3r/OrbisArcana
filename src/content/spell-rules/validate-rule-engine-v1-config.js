import { validateSpellRulesV1 } from "./validate-spell-rules-v1.js";
import { RULE_ENGINE_V1_MASTER_CONTROL } from "./rule-engine-v1-master-control.js";

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

export function validateRuleEngineV1Config(config = null) {
  const source = (config && typeof config === "object")
    ? config
    : RULE_ENGINE_V1_MASTER_CONTROL;
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
  const ruleExecuteActionsOverrides = asObj(cfg.ruleExecuteActionsOverrides);
  const ruleActionTypeEnabledOverrides = asObj(cfg.ruleActionTypeEnabledOverrides);
  const signalEnabledOverrides = asObj(cfg.signalEnabledOverrides);
  const signalDebounceOverrides = asObj(cfg.signalDebounceOverrides);
  const signalMaxMatchesOverrides = asObj(cfg.signalMaxMatchesOverrides);
  const signalPriorityOverrides = asObj(cfg.signalPriorityOverrides);
  const signalSourceEventOverrides = asObj(cfg.signalSourceEventOverrides);
  const signalWhereOverrides = asObj(cfg.signalWhereOverrides);
  const sourceEventEnabledOverrides = asObj(cfg.sourceEventEnabledOverrides);
  const sourceEventDebounceOverrides = asObj(cfg.sourceEventDebounceOverrides);
  const sourceEventMaxSignalsOverrides = asObj(cfg.sourceEventMaxSignalsOverrides);
  const sourceEventStopOnFirstSignalMatchOverrides = asObj(cfg.sourceEventStopOnFirstSignalMatchOverrides);
  const sourceEventEmitPreviewMatchedOverrides = asObj(cfg.sourceEventEmitPreviewMatchedOverrides);
  const sourceEventActionTypeEnabledOverrides = asObj(cfg.sourceEventActionTypeEnabledOverrides);
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

  const errors = [];
  if (!asText(cfg.id)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.id is required");
  if (!asText(cfg.version)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.version is required");
  if (Object.prototype.hasOwnProperty.call(cfg, "enabled") && typeof cfg.enabled !== "boolean") {
    errors.push("RULE_ENGINE_V1_MASTER_CONTROL.enabled must be boolean when present");
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "execution")) {
    if (!cfg.execution || typeof cfg.execution !== "object" || Array.isArray(cfg.execution)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution must be an object when present");
    } else if (Object.prototype.hasOwnProperty.call(execution, "stopOnFirstMatch")) {
      if (typeof execution.stopOnFirstMatch !== "boolean") {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.stopOnFirstMatch must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxMatchesPerSignal")) {
      const n = Number(execution.maxMatchesPerSignal);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.maxMatchesPerSignal must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxSignalsPerEvent")) {
      const n = Number(execution.maxSignalsPerEvent);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.maxSignalsPerEvent must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "maxActionsPerRuleMatch")) {
      const n = Number(execution.maxActionsPerRuleMatch);
      if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.maxActionsPerRuleMatch must be an integer >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "sourceEventDebounceMs")) {
      const n = Number(execution.sourceEventDebounceMs);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.sourceEventDebounceMs must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "emitPreviewMatchedEvents")) {
      if (typeof execution.emitPreviewMatchedEvents !== "boolean") {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.emitPreviewMatchedEvents must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "executeActions")) {
      if (typeof execution.executeActions !== "boolean") {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.executeActions must be boolean when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "actionTypeEnabled")) {
      const actionTypeEnabled = execution.actionTypeEnabled;
      if (!actionTypeEnabled || typeof actionTypeEnabled !== "object" || Array.isArray(actionTypeEnabled)) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.actionTypeEnabled must be an object when present");
      } else {
        const allowed = new Set(["wake_win", "event"]);
        for (const [k, v] of Object.entries(actionTypeEnabled)) {
          if (!allowed.has(String(k || "").trim().toLowerCase())) {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.execution.actionTypeEnabled has unsupported key: ${k}`);
            continue;
          }
          if (typeof v !== "boolean") {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.execution.actionTypeEnabled[${k}] must be boolean`);
          }
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "cooldownScale")) {
      const n = Number(execution.cooldownScale);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.cooldownScale must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "matchWindowScale")) {
      const n = Number(execution.matchWindowScale);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.matchWindowScale must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "signalDebounceMs")) {
      const n = Number(execution.signalDebounceMs);
      if (!Number.isFinite(n) || n < 0) {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.signalDebounceMs must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(execution, "stopOnFirstSignalMatchPerEvent")) {
      if (typeof execution.stopOnFirstSignalMatchPerEvent !== "boolean") {
        errors.push("RULE_ENGINE_V1_MASTER_CONTROL.execution.stopOnFirstSignalMatchPerEvent must be boolean when present");
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleDefaults")) {
    if (!cfg.ruleDefaults || typeof cfg.ruleDefaults !== "object" || Array.isArray(cfg.ruleDefaults)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleDefaults must be an object when present");
    } else {
      if (Object.prototype.hasOwnProperty.call(ruleDefaults, "cooldownMs")) {
        const n = Number(ruleDefaults.cooldownMs);
        if (!Number.isFinite(n) || n < 0) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleDefaults.cooldownMs must be a finite number >= 0");
        }
      }
      if (Object.prototype.hasOwnProperty.call(ruleDefaults, "matchWindowMs")) {
        const n = Number(ruleDefaults.matchWindowMs);
        if (!Number.isFinite(n) || n < 100) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleDefaults.matchWindowMs must be a finite number >= 100");
        }
      }
      if (Object.prototype.hasOwnProperty.call(ruleDefaults, "priority")) {
        const n = Number(ruleDefaults.priority);
        if (!Number.isFinite(n)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleDefaults.priority must be a finite number");
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "rulePriorityOverrides")) {
    if (!cfg.rulePriorityOverrides || typeof cfg.rulePriorityOverrides !== "object" || Array.isArray(cfg.rulePriorityOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.rulePriorityOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(rulePriorityOverrides)) {
        if (!Number.isFinite(Number(value))) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.rulePriorityOverrides[${ruleId}] must be a finite number`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleTimingOverrides")) {
    if (!cfg.ruleTimingOverrides || typeof cfg.ruleTimingOverrides !== "object" || Array.isArray(cfg.ruleTimingOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleTimingOverrides)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides[${ruleId}] must be an object`);
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(value, "cooldownMs")) {
          const n = Number(value.cooldownMs);
          if (!Number.isFinite(n) || n < 0) {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides[${ruleId}].cooldownMs must be a finite number >= 0`);
          }
        }
        if (Object.prototype.hasOwnProperty.call(value, "matchWindowMs")) {
          const n = Number(value.matchWindowMs);
          if (!Number.isFinite(n) || n < 100) {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides[${ruleId}].matchWindowMs must be a finite number >= 100`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleActionLimitOverrides")) {
    if (!cfg.ruleActionLimitOverrides || typeof cfg.ruleActionLimitOverrides !== "object" || Array.isArray(cfg.ruleActionLimitOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleActionLimitOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleActionLimitOverrides)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleActionLimitOverrides[${ruleId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleCooldownScaleOverrides")) {
    if (!cfg.ruleCooldownScaleOverrides || typeof cfg.ruleCooldownScaleOverrides !== "object" || Array.isArray(cfg.ruleCooldownScaleOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleCooldownScaleOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleCooldownScaleOverrides)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleCooldownScaleOverrides[${ruleId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleMatchWindowScaleOverrides")) {
    if (!cfg.ruleMatchWindowScaleOverrides || typeof cfg.ruleMatchWindowScaleOverrides !== "object" || Array.isArray(cfg.ruleMatchWindowScaleOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleMatchWindowScaleOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleMatchWindowScaleOverrides)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleMatchWindowScaleOverrides[${ruleId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleEmitPreviewMatchedOverrides")) {
    if (!cfg.ruleEmitPreviewMatchedOverrides || typeof cfg.ruleEmitPreviewMatchedOverrides !== "object" || Array.isArray(cfg.ruleEmitPreviewMatchedOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleEmitPreviewMatchedOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleExecuteActionsOverrides")) {
    if (!cfg.ruleExecuteActionsOverrides || typeof cfg.ruleExecuteActionsOverrides !== "object" || Array.isArray(cfg.ruleExecuteActionsOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleExecuteActionsOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleExecuteActionsOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleExecuteActionsOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleActionTypeEnabledOverrides")) {
    if (!cfg.ruleActionTypeEnabledOverrides || typeof cfg.ruleActionTypeEnabledOverrides !== "object" || Array.isArray(cfg.ruleActionTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleActionTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [ruleId, value] of Object.entries(ruleActionTypeEnabledOverrides)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          const key = String(actionType || "").trim().toLowerCase();
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleActionTypeEnabledOverrides[${ruleId}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalEnabledOverrides")) {
    if (!cfg.signalEnabledOverrides || typeof cfg.signalEnabledOverrides !== "object" || Array.isArray(cfg.signalEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signalEnabledOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalEnabledOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalEnabledOverrides[${signalId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalDebounceOverrides")) {
    if (!cfg.signalDebounceOverrides || typeof cfg.signalDebounceOverrides !== "object" || Array.isArray(cfg.signalDebounceOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signalDebounceOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalDebounceOverrides)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalDebounceOverrides[${signalId}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalMaxMatchesOverrides")) {
    if (!cfg.signalMaxMatchesOverrides || typeof cfg.signalMaxMatchesOverrides !== "object" || Array.isArray(cfg.signalMaxMatchesOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signalMaxMatchesOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalMaxMatchesOverrides)) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalMaxMatchesOverrides[${signalId}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalPriorityOverrides")) {
    if (!cfg.signalPriorityOverrides || typeof cfg.signalPriorityOverrides !== "object" || Array.isArray(cfg.signalPriorityOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signalPriorityOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalPriorityOverrides)) {
        if (!Number.isFinite(Number(value))) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalPriorityOverrides[${signalId}] must be a finite number`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalSourceEventOverrides")) {
    if (!cfg.signalSourceEventOverrides || typeof cfg.signalSourceEventOverrides !== "object" || Array.isArray(cfg.signalSourceEventOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signalSourceEventOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalSourceEventOverrides)) {
        if (!asText(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalSourceEventOverrides[${signalId}] must be a non-empty source event string`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "signalWhereOverrides")) {
    if (!cfg.signalWhereOverrides || typeof cfg.signalWhereOverrides !== "object" || Array.isArray(cfg.signalWhereOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides must be an object when present");
    } else {
      for (const [signalId, value] of Object.entries(signalWhereOverrides)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}] must be an object`);
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(value, "path") && !asText(value.path)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}].path must be non-empty when present`);
        }
        const hasEq = Object.prototype.hasOwnProperty.call(value, "eq");
        const hasGt = Object.prototype.hasOwnProperty.call(value, "gt");
        const hasGte = Object.prototype.hasOwnProperty.call(value, "gte");
        const hasLt = Object.prototype.hasOwnProperty.call(value, "lt");
        const hasLte = Object.prototype.hasOwnProperty.call(value, "lte");
        if (hasEq && (hasGt || hasGte || hasLt || hasLte)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}] cannot combine eq with numeric comparators`);
        }
        if (hasGt && !isFiniteNumber(value.gt)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}].gt must be a finite number`);
        }
        if (hasGte && !isFiniteNumber(value.gte)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}].gte must be a finite number`);
        }
        if (hasLt && !isFiniteNumber(value.lt)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}].lt must be a finite number`);
        }
        if (hasLte && !isFiniteNumber(value.lte)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides[${signalId}].lte must be a finite number`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventEnabledOverrides")) {
    if (!cfg.sourceEventEnabledOverrides || typeof cfg.sourceEventEnabledOverrides !== "object" || Array.isArray(cfg.sourceEventEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEnabledOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventEnabledOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEnabledOverrides contains empty source event key");
          continue;
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEnabledOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventDebounceOverrides")) {
    if (!cfg.sourceEventDebounceOverrides || typeof cfg.sourceEventDebounceOverrides !== "object" || Array.isArray(cfg.sourceEventDebounceOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventDebounceOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventDebounceOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventDebounceOverrides contains empty source event key");
          continue;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventDebounceOverrides[${sourceEvent}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxSignalsOverrides")) {
    if (!cfg.sourceEventMaxSignalsOverrides || typeof cfg.sourceEventMaxSignalsOverrides !== "object" || Array.isArray(cfg.sourceEventMaxSignalsOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxSignalsOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxSignalsOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxSignalsOverrides contains empty source event key");
          continue;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxSignalsOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventStopOnFirstSignalMatchOverrides")) {
    if (!cfg.sourceEventStopOnFirstSignalMatchOverrides || typeof cfg.sourceEventStopOnFirstSignalMatchOverrides !== "object" || Array.isArray(cfg.sourceEventStopOnFirstSignalMatchOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventStopOnFirstSignalMatchOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides contains empty source event key");
          continue;
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventEmitPreviewMatchedOverrides")) {
    if (!cfg.sourceEventEmitPreviewMatchedOverrides || typeof cfg.sourceEventEmitPreviewMatchedOverrides !== "object" || Array.isArray(cfg.sourceEventEmitPreviewMatchedOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventEmitPreviewMatchedOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides contains empty source event key");
          continue;
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventActionTypeEnabledOverrides")) {
    if (!cfg.sourceEventActionTypeEnabledOverrides || typeof cfg.sourceEventActionTypeEnabledOverrides !== "object" || Array.isArray(cfg.sourceEventActionTypeEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides must be an object when present");
    } else {
      const allowed = new Set(["wake_win", "event"]);
      for (const [sourceEvent, value] of Object.entries(sourceEventActionTypeEnabledOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides contains empty source event key");
          continue;
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] must be an object`);
          continue;
        }
        for (const [actionType, enabled] of Object.entries(value)) {
          const key = String(actionType || "").trim().toLowerCase();
          if (!allowed.has(key)) {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}] has unsupported key: ${actionType}`);
            continue;
          }
          if (typeof enabled !== "boolean") {
            errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides[${sourceEvent}][${actionType}] must be boolean`);
          }
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventExecuteActionsOverrides")) {
    if (!cfg.sourceEventExecuteActionsOverrides || typeof cfg.sourceEventExecuteActionsOverrides !== "object" || Array.isArray(cfg.sourceEventExecuteActionsOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventExecuteActionsOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventExecuteActionsOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventExecuteActionsOverrides contains empty source event key");
          continue;
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventExecuteActionsOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventCooldownScaleOverrides")) {
    if (!cfg.sourceEventCooldownScaleOverrides || typeof cfg.sourceEventCooldownScaleOverrides !== "object" || Array.isArray(cfg.sourceEventCooldownScaleOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventCooldownScaleOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventCooldownScaleOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventCooldownScaleOverrides contains empty source event key");
          continue;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventCooldownScaleOverrides[${sourceEvent}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMatchWindowScaleOverrides")) {
    if (!cfg.sourceEventMatchWindowScaleOverrides || typeof cfg.sourceEventMatchWindowScaleOverrides !== "object" || Array.isArray(cfg.sourceEventMatchWindowScaleOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMatchWindowScaleOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides contains empty source event key");
          continue;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides[${sourceEvent}] must be a finite number >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxActionsPerRuleMatchOverrides")) {
    if (!cfg.sourceEventMaxActionsPerRuleMatchOverrides || typeof cfg.sourceEventMaxActionsPerRuleMatchOverrides !== "object" || Array.isArray(cfg.sourceEventMaxActionsPerRuleMatchOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxActionsPerRuleMatchOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides contains empty source event key");
          continue;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventStopOnFirstMatchOverrides")) {
    if (!cfg.sourceEventStopOnFirstMatchOverrides || typeof cfg.sourceEventStopOnFirstMatchOverrides !== "object" || Array.isArray(cfg.sourceEventStopOnFirstMatchOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventStopOnFirstMatchOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides contains empty source event key");
          continue;
        }
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides[${sourceEvent}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "sourceEventMaxMatchesPerSignalOverrides")) {
    if (!cfg.sourceEventMaxMatchesPerSignalOverrides || typeof cfg.sourceEventMaxMatchesPerSignalOverrides !== "object" || Array.isArray(cfg.sourceEventMaxMatchesPerSignalOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides must be an object when present");
    } else {
      for (const [sourceEvent, value] of Object.entries(sourceEventMaxMatchesPerSignalOverrides)) {
        if (!asText(sourceEvent)) {
          errors.push("RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides contains empty source event key");
          continue;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides[${sourceEvent}] must be an integer >= 0`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "ruleEnabledOverrides")) {
    if (!cfg.ruleEnabledOverrides || typeof cfg.ruleEnabledOverrides !== "object" || Array.isArray(cfg.ruleEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.ruleEnabledOverrides must be an object when present");
    } else {
      for (const [ruleId, value] of Object.entries(ruleEnabledOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleEnabledOverrides[${ruleId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "actionEnabledOverrides")) {
    if (!cfg.actionEnabledOverrides || typeof cfg.actionEnabledOverrides !== "object" || Array.isArray(cfg.actionEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.actionEnabledOverrides must be an object when present");
    } else {
      for (const [actionKey, value] of Object.entries(actionEnabledOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionEnabledOverrides[${actionKey}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "actionArgOverrides")) {
    if (!cfg.actionArgOverrides || typeof cfg.actionArgOverrides !== "object" || Array.isArray(cfg.actionArgOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.actionArgOverrides must be an object when present");
    } else {
      for (const [actionKey, value] of Object.entries(actionArgOverrides)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionArgOverrides[${actionKey}] must be an object`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "eventEnabledOverrides")) {
    if (!cfg.eventEnabledOverrides || typeof cfg.eventEnabledOverrides !== "object" || Array.isArray(cfg.eventEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.eventEnabledOverrides must be an object when present");
    } else {
      for (const [eventId, value] of Object.entries(eventEnabledOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventEnabledOverrides[${eventId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "eventDefaultOverrides")) {
    if (!cfg.eventDefaultOverrides || typeof cfg.eventDefaultOverrides !== "object" || Array.isArray(cfg.eventDefaultOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.eventDefaultOverrides must be an object when present");
    } else {
      for (const [eventId, value] of Object.entries(eventDefaultOverrides)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventDefaultOverrides[${eventId}] must be an object`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "windowEnabledOverrides")) {
    if (!cfg.windowEnabledOverrides || typeof cfg.windowEnabledOverrides !== "object" || Array.isArray(cfg.windowEnabledOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.windowEnabledOverrides must be an object when present");
    } else {
      for (const [windowId, value] of Object.entries(windowEnabledOverrides)) {
        if (typeof value !== "boolean") {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.windowEnabledOverrides[${windowId}] must be boolean`);
        }
      }
    }
  }
  if (Object.prototype.hasOwnProperty.call(cfg, "windowDefaultOverrides")) {
    if (!cfg.windowDefaultOverrides || typeof cfg.windowDefaultOverrides !== "object" || Array.isArray(cfg.windowDefaultOverrides)) {
      errors.push("RULE_ENGINE_V1_MASTER_CONTROL.windowDefaultOverrides must be an object when present");
    } else {
      for (const [windowId, value] of Object.entries(windowDefaultOverrides)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.windowDefaultOverrides[${windowId}] must be an object`);
        }
      }
    }
  }
  if (!Array.isArray(cfg.signals)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signals must be an array");
  if (!Array.isArray(cfg.windows)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.windows must be an array");
  if (!Array.isArray(cfg.events)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.events must be an array");
  if (!Array.isArray(cfg.rules)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.rules must be an array");

  const ruleErrors = validateSpellRulesV1(rules, { signals, windows, events });
  errors.push(...ruleErrors);

  const eventIds = new Set(events.map((e) => String(e && e.id || "").trim().toLowerCase()).filter(Boolean));
  for (const eventId of Object.keys(eventEnabledOverrides)) {
    const id = String(eventId || "").trim().toLowerCase();
    if (!id || eventIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventEnabledOverrides references unknown event id: ${id}`);
  }
  for (const eventId of Object.keys(eventDefaultOverrides)) {
    const id = String(eventId || "").trim().toLowerCase();
    if (!id || eventIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventDefaultOverrides references unknown event id: ${id}`);
  }
  const windowIds = new Set(windows.map((w) => String(w && w.id || "").trim().toLowerCase()).filter(Boolean));
  for (const windowId of Object.keys(windowEnabledOverrides)) {
    const id = String(windowId || "").trim().toLowerCase();
    if (!id || windowIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.windowEnabledOverrides references unknown window id: ${id}`);
  }
  for (const windowId of Object.keys(windowDefaultOverrides)) {
    const id = String(windowId || "").trim().toLowerCase();
    if (!id || windowIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.windowDefaultOverrides references unknown window id: ${id}`);
  }
  const ruleIds = new Set(rules.map((r) => String(r && r.id || "").trim()).filter(Boolean));
  const signalIds = new Set(signals.map((s) => String(s && s.id || "").trim().toLowerCase()).filter(Boolean));
  for (const signalId of Object.keys(signalEnabledOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalEnabledOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalDebounceOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalDebounceOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalMaxMatchesOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalMaxMatchesOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalPriorityOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalPriorityOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalSourceEventOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalSourceEventOverrides references unknown signal id: ${id}`);
  }
  for (const signalId of Object.keys(signalWhereOverrides)) {
    const id = String(signalId || "").trim().toLowerCase();
    if (!id || signalIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.signalWhereOverrides references unknown signal id: ${id}`);
  }
  const sourceEvents = new Set(
    signals
      .map((s) => String(s && s.sourceEvent || "").trim())
      .filter(Boolean)
  );
  for (const sourceEvent of Object.keys(sourceEventEnabledOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEnabledOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventDebounceOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventDebounceOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxSignalsOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxSignalsOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventStopOnFirstSignalMatchOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstSignalMatchOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventEmitPreviewMatchedOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventEmitPreviewMatchedOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventActionTypeEnabledOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventActionTypeEnabledOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventExecuteActionsOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventExecuteActionsOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventCooldownScaleOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventCooldownScaleOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMatchWindowScaleOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMatchWindowScaleOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxActionsPerRuleMatchOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxActionsPerRuleMatchOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventStopOnFirstMatchOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventStopOnFirstMatchOverrides references unknown source event: ${evt}`);
  }
  for (const sourceEvent of Object.keys(sourceEventMaxMatchesPerSignalOverrides)) {
    const evt = String(sourceEvent || "").trim();
    if (!evt || sourceEvents.has(evt)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.sourceEventMaxMatchesPerSignalOverrides references unknown source event: ${evt}`);
  }
  for (const ruleId of Object.keys(ruleTimingOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleActionLimitOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleActionLimitOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleCooldownScaleOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleCooldownScaleOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleMatchWindowScaleOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleMatchWindowScaleOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleEmitPreviewMatchedOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleEmitPreviewMatchedOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleExecuteActionsOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleExecuteActionsOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleActionTypeEnabledOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleActionTypeEnabledOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(rulePriorityOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.rulePriorityOverrides references unknown rule id: ${id}`);
  }
  for (const ruleId of Object.keys(ruleEnabledOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleEnabledOverrides references unknown rule id: ${id}`);
  }
  for (const actionKey of Object.keys(actionArgOverrides)) {
    const key = String(actionKey || "").trim();
    if (!key) continue;
    const firstDot = key.indexOf(".");
    const ruleId = firstDot > 0 ? key.slice(0, firstDot) : key;
    if (!ruleId || ruleIds.has(ruleId)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionArgOverrides references unknown rule id: ${ruleId}`);
  }
  const ruleById = rules.reduce((acc, rule) => {
    const id = String(rule && rule.id || "").trim();
    if (id) acc[id] = rule;
    return acc;
  }, Object.create(null));
  for (const actionKey of Object.keys(actionEnabledOverrides)) {
    const parsed = parseActionOverrideKey(actionKey);
    if (!parsed) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionEnabledOverrides has invalid key format: ${actionKey}`);
      continue;
    }
    const rule = ruleById[parsed.ruleId];
    if (!rule) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionEnabledOverrides references unknown rule id: ${parsed.ruleId}`);
      continue;
    }
    if (!actionOverrideKeyTargetsExistingAction(rule, parsed)) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionEnabledOverrides references unknown action key: ${actionKey}`);
    }
  }
  for (const actionKey of Object.keys(actionArgOverrides)) {
    const parsed = parseActionOverrideKey(actionKey);
    if (!parsed) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionArgOverrides has invalid key format: ${actionKey}`);
      continue;
    }
    const rule = ruleById[parsed.ruleId];
    if (!rule) continue;
    if (!actionOverrideKeyTargetsExistingAction(rule, parsed)) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.actionArgOverrides references unknown action key: ${actionKey}`);
    }
  }

  for (const eventDef of events) {
    const id = String(eventDef && eventDef.id || "").trim().toLowerCase();
    if (!id) continue;
    if (!eventRuntimeBindings[id]) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings missing id: ${id}`);
    }
  }

  return errors;
}
