import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_BY_ID } from "../spell-rules/event-definitions.js";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  return String(v == null ? "" : v).trim();
}

function normalizeSpellId(spellIdRaw) {
  const id = asText(spellIdRaw).toLowerCase();
  if (!id) return "";
  return id.startsWith("spell.") ? id.slice("spell.".length) : id;
}

function normalizeEventId(eventIdRaw) {
  const id = asText(eventIdRaw).toLowerCase();
  if (!id) return "";
  return id.startsWith("event.") ? id.slice("event.".length) : id;
}

function pushUnsupportedKeys(errors, context, obj, allowedKeys) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(asObj(obj))) {
    if (!allowed.has(key)) errors.push(`${context} contains unsupported key: ${key}`);
  }
}

export function validateOrchestratorV1(cfg) {
  const errors = [];
  const target = asObj(cfg);
  pushUnsupportedKeys(errors, "ORCHESTRATOR_V1", target, ["version", "enabled", "defaults", "rules"]);

  if (asText(target.version) !== "1") {
    errors.push("ORCHESTRATOR_V1.version must be \"1\"");
  }
  if (typeof target.enabled !== "boolean") {
    errors.push("ORCHESTRATOR_V1.enabled must be boolean");
  }
  if (!Array.isArray(target.rules)) {
    errors.push("ORCHESTRATOR_V1.rules must be an array");
    return errors;
  }

  const ids = new Set();
  for (const rawRule of target.rules) {
    const rule = asObj(rawRule);
    const ruleId = asText(rule.id);
    if (!ruleId) {
      errors.push("ORCHESTRATOR_V1.rules[] entry is missing id");
      continue;
    }
    if (ids.has(ruleId)) errors.push(`ORCHESTRATOR_V1.rules contains duplicate id: ${ruleId}`);
    ids.add(ruleId);

    pushUnsupportedKeys(errors, `rule ${ruleId}`, rule, ["id", "on", "trigger", "enabled", "priority"]);
    if (Object.prototype.hasOwnProperty.call(rule, "enabled") && typeof rule.enabled !== "boolean") {
      errors.push(`rule ${ruleId} enabled must be boolean when present`);
    }
    if (Object.prototype.hasOwnProperty.call(rule, "priority") && !Number.isFinite(Number(rule.priority))) {
      errors.push(`rule ${ruleId} priority must be a finite number when present`);
    }

    const on = asObj(rule.on);
    pushUnsupportedKeys(errors, `rule ${ruleId} on`, on, ["spell"]);
    const spellId = normalizeSpellId(on.spell);
    if (!spellId) {
      errors.push(`rule ${ruleId} must define on.spell`);
    } else if (!Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, spellId)) {
      errors.push(`rule ${ruleId} references inactive or unknown spell id: ${on.spell}`);
    }

    if (!Array.isArray(rule.trigger) || !rule.trigger.length) {
      errors.push(`rule ${ruleId} must define trigger[]`);
      continue;
    }
    for (const rawTrigger of rule.trigger) {
      const trigger = asObj(rawTrigger);
      pushUnsupportedKeys(errors, `rule ${ruleId} trigger`, trigger, ["event", "enabled", "args"]);
      if (Object.prototype.hasOwnProperty.call(trigger, "enabled") && typeof trigger.enabled !== "boolean") {
        errors.push(`rule ${ruleId} trigger enabled must be boolean when present`);
      }
      const eventId = normalizeEventId(trigger.event);
      if (!eventId) {
        errors.push(`rule ${ruleId} trigger is missing event`);
      } else if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_BY_ID, eventId)) {
        errors.push(`rule ${ruleId} trigger references unknown event id: ${trigger.event}`);
      }
      if (Object.prototype.hasOwnProperty.call(trigger, "args")) {
        const args = trigger.args;
        if (!args || typeof args !== "object" || Array.isArray(args)) {
          errors.push(`rule ${ruleId} trigger args must be an object when present`);
        }
      }
    }
  }
  return errors;
}
