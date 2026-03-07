import { validateSpellRulesV1 } from "./validate-spell-rules-v1.js";
import { RULE_ENGINE_V1_MASTER_CONTROL } from "./rule-engine-v1-master-control.js";

function asObj(v) {
  return (v && typeof v === "object") ? v : Object.create(null);
}

function asText(v) {
  return String(v || "").trim();
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
  const signalEnabledOverrides = asObj(cfg.signalEnabledOverrides);
  const ruleEnabledOverrides = asObj(cfg.ruleEnabledOverrides);
  const actionEnabledOverrides = asObj(cfg.actionEnabledOverrides);
  const eventDefaultOverrides = asObj(cfg.eventDefaultOverrides);
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
  for (const eventId of Object.keys(eventDefaultOverrides)) {
    const id = String(eventId || "").trim().toLowerCase();
    if (!id || eventIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventDefaultOverrides references unknown event id: ${id}`);
  }
  const windowIds = new Set(windows.map((w) => String(w && w.id || "").trim().toLowerCase()).filter(Boolean));
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
  for (const ruleId of Object.keys(ruleTimingOverrides)) {
    const id = String(ruleId || "").trim();
    if (!id || ruleIds.has(id)) continue;
    errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.ruleTimingOverrides references unknown rule id: ${id}`);
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
