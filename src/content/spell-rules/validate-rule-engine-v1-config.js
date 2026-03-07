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

  for (const eventDef of events) {
    const id = String(eventDef && eventDef.id || "").trim().toLowerCase();
    if (!id) continue;
    if (!eventRuntimeBindings[id]) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings missing id: ${id}`);
    }
  }

  return errors;
}
