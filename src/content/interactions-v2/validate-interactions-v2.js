import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  return String(v == null ? "" : v).trim();
}

export function validateInteractionsV2(input = INTERACTIONS_V2) {
  const errors = [];
  const cfg = asObj(input);

  if (asText(cfg.version) !== "2") {
    errors.push("INTERACTIONS_V2.version must be \"2\"");
  }
  if (typeof cfg.enabled !== "boolean") {
    errors.push("INTERACTIONS_V2.enabled must be boolean");
  }
  if (!Array.isArray(cfg.rules)) {
    errors.push("INTERACTIONS_V2.rules must be an array");
    return { ok: false, errors };
  }

  const ids = new Set();
  for (const rule of cfg.rules) {
    const r = asObj(rule);
    const ruleId = asText(r.id);
    if (!ruleId) {
      errors.push("INTERACTIONS_V2.rules[] entry is missing id");
      continue;
    }
    if (ids.has(ruleId)) {
      errors.push(`INTERACTIONS_V2.rules contains duplicate id: ${ruleId}`);
    }
    ids.add(ruleId);

    const on = asObj(r.on);
    if (!Array.isArray(on.all) || !on.all.length) {
      errors.push(`rule ${ruleId} must define on.all[]`);
    } else {
      for (const c of on.all) {
        const cond = asObj(c);
        const type = asText(cond.type);
        const id = asText(cond.id);
        if (!type) errors.push(`rule ${ruleId} has on.all condition missing type`);
        if (!id) errors.push(`rule ${ruleId} has on.all condition missing id`);
        if (type === "spell" && id && !Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id.toLowerCase())) {
          errors.push(`rule ${ruleId} references inactive or unknown spell id: ${id}`);
        }
      }
    }

    if (!Array.isArray(r.then) || !r.then.length) {
      errors.push(`rule ${ruleId} must define then[] actions`);
    } else {
      for (const a of r.then) {
        const action = asObj(a);
        const type = asText(action.type);
        if (type !== "wake_win" && type !== "event") {
          errors.push(`rule ${ruleId} has unsupported action type: ${type || "(empty)"}`);
          continue;
        }
        if (type === "wake_win") {
          if (!Array.isArray(action.spells) || !action.spells.length) {
            errors.push(`rule ${ruleId} wake_win action requires spells[]`);
          }
        }
        if (type === "event" && !asText(action.id)) {
          errors.push(`rule ${ruleId} event action requires id`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

