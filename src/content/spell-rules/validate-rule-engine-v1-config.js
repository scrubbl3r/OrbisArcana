import { validateSpellRulesV1 } from "./validate-spell-rules-v1.js";

function asObj(v) {
  return (v && typeof v === "object") ? v : Object.create(null);
}

export function validateRuleEngineV1Config(config = {}) {
  const cfg = asObj(config);
  const signals = Array.isArray(cfg.signals) ? cfg.signals : [];
  const windows = Array.isArray(cfg.windows) ? cfg.windows : [];
  const events = Array.isArray(cfg.events) ? cfg.events : [];
  const rules = Array.isArray(cfg.rules) ? cfg.rules : [];
  const eventRuntimeBindings = asObj(cfg.eventRuntimeBindings);

  const errors = [];
  if (!Array.isArray(cfg.signals)) errors.push("RULE_ENGINE_V1_CONFIG.signals must be an array");
  if (!Array.isArray(cfg.windows)) errors.push("RULE_ENGINE_V1_CONFIG.windows must be an array");
  if (!Array.isArray(cfg.events)) errors.push("RULE_ENGINE_V1_CONFIG.events must be an array");
  if (!Array.isArray(cfg.rules)) errors.push("RULE_ENGINE_V1_CONFIG.rules must be an array");

  const ruleErrors = validateSpellRulesV1(rules, { signals, windows, events });
  errors.push(...ruleErrors);

  for (const eventDef of events) {
    const id = String(eventDef && eventDef.id || "").trim().toLowerCase();
    if (!id) continue;
    if (!eventRuntimeBindings[id]) {
      errors.push(`RULE_ENGINE_V1_CONFIG.eventRuntimeBindings missing id: ${id}`);
    }
  }

  return errors;
}
