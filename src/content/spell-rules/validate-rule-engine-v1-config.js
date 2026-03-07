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
  if (!Array.isArray(cfg.signals)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.signals must be an array");
  if (!Array.isArray(cfg.windows)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.windows must be an array");
  if (!Array.isArray(cfg.events)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.events must be an array");
  if (!Array.isArray(cfg.rules)) errors.push("RULE_ENGINE_V1_MASTER_CONTROL.rules must be an array");

  const ruleErrors = validateSpellRulesV1(rules, { signals, windows, events });
  errors.push(...ruleErrors);

  for (const eventDef of events) {
    const id = String(eventDef && eventDef.id || "").trim().toLowerCase();
    if (!id) continue;
    if (!eventRuntimeBindings[id]) {
      errors.push(`RULE_ENGINE_V1_MASTER_CONTROL.eventRuntimeBindings missing id: ${id}`);
    }
  }

  return errors;
}
