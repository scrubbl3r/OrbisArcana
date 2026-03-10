import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID } from "./spellbook-v2.js";
import { EVENT_DEFINITIONS_V1_BY_ID } from "../spell-rules/event-definitions-v1.js";
import { SIGNAL_DEFINITIONS_V1_BY_ID } from "../spell-rules/signal-definitions-v1.js";

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  return String(v == null ? "" : v).trim();
}

function isFiniteNonNegative(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

function isEntityIdLike(v) {
  return /^[A-Za-z0-9_]+$/.test(String(v || ""));
}

const KNOWN_GESTURE_IDS = new Set(
  Object.keys(SIGNAL_DEFINITIONS_V1_BY_ID || {})
    .filter((signalId) => String(signalId || "").startsWith("gesture."))
    .map((signalId) => String(signalId || "").slice("gesture.".length))
    .filter(Boolean)
);

const KNOWN_ORB_STATE_IDS = new Set(
  Object.keys(SIGNAL_DEFINITIONS_V1_BY_ID || {})
    .filter((signalId) => String(signalId || "").startsWith("orb_state."))
    .map((signalId) => String(signalId || "").slice("orb_state.".length))
    .filter(Boolean)
);

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
  if (Object.prototype.hasOwnProperty.call(cfg, "defaults")) {
    const defaults = asObj(cfg.defaults);
    if (Object.prototype.hasOwnProperty.call(defaults, "wakeWin")) {
      const wakeWin = asObj(defaults.wakeWin);
      for (const key of Object.keys(wakeWin)) {
        if (key !== "ttlMs") {
          errors.push(`INTERACTIONS_V2.defaults.wakeWin contains unsupported key: ${key}`);
        }
      }
      if (Object.prototype.hasOwnProperty.call(wakeWin, "ttlMs") && !isFiniteNonNegative(wakeWin.ttlMs)) {
        errors.push("INTERACTIONS_V2.defaults.wakeWin.ttlMs must be a finite number >= 0 when present");
      }
    }
    if (Object.prototype.hasOwnProperty.call(defaults, "event")) {
      const eventDefaults = asObj(defaults.event);
      for (const [eventId, eventArgs] of Object.entries(eventDefaults)) {
        if (!isEntityIdLike(eventId)) {
          errors.push(`INTERACTIONS_V2.defaults.event key has invalid id shape: ${eventId}`);
        } else if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_V1_BY_ID, eventId.toLowerCase())) {
          errors.push(`INTERACTIONS_V2.defaults.event references unknown event id: ${eventId}`);
        }
        if (!eventArgs || typeof eventArgs !== "object" || Array.isArray(eventArgs)) {
          errors.push(`INTERACTIONS_V2.defaults.event[${eventId}] must be an object`);
        }
      }
    }
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
        const type = asText(cond.type).toLowerCase();
        const id = asText(cond.id);
        if (!type) errors.push(`rule ${ruleId} has on.all condition missing type`);
        if (!id) errors.push(`rule ${ruleId} has on.all condition missing id`);
        if (type && type !== "spell" && type !== "gesture" && type !== "orb_state") {
          errors.push(`rule ${ruleId} has unsupported on.all condition type: ${type}`);
        }
        if (id && !isEntityIdLike(id)) {
          errors.push(`rule ${ruleId} has invalid on.all id shape (use letters/numbers/_): ${id}`);
        }
        if (type === "spell" && id && !Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id.toLowerCase())) {
          errors.push(`rule ${ruleId} references inactive or unknown spell id: ${id}`);
        }
        if (type === "gesture" && id && !KNOWN_GESTURE_IDS.has(id.toLowerCase())) {
          errors.push(`rule ${ruleId} references unknown gesture id: ${id}`);
        }
        if (type === "orb_state" && id && !KNOWN_ORB_STATE_IDS.has(id.toLowerCase())) {
          errors.push(`rule ${ruleId} references unknown orb_state id: ${id}`);
        }
      }
    }

    if (!Array.isArray(r.then) || !r.then.length) {
      errors.push(`rule ${ruleId} must define then[] actions`);
    } else {
      for (const a of r.then) {
        const action = asObj(a);
        const type = asText(action.type).toLowerCase();
        if (type !== "wake_win" && type !== "event") {
          errors.push(`rule ${ruleId} has unsupported action type: ${type || "(empty)"}`);
          continue;
        }
        if (type === "wake_win") {
          if (!Array.isArray(action.spells) || !action.spells.length) {
            errors.push(`rule ${ruleId} wake_win action requires spells[]`);
          } else {
            for (const spellId of action.spells) {
              const id = asText(spellId);
              if (!isEntityIdLike(id)) {
                errors.push(`rule ${ruleId} wake_win spell has invalid id shape: ${id}`);
                continue;
              }
              if (!Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, id.toLowerCase())) {
                errors.push(`rule ${ruleId} wake_win references inactive or unknown spell id: ${id}`);
              }
            }
          }
          if (Object.prototype.hasOwnProperty.call(action, "ttlMs") && !isFiniteNonNegative(action.ttlMs)) {
            errors.push(`rule ${ruleId} wake_win ttlMs must be a finite number >= 0 when present`);
          }
        }
        if (type === "event") {
          const eventId = asText(action.id);
          if (!eventId) {
            errors.push(`rule ${ruleId} event action requires id`);
          } else if (!isEntityIdLike(eventId)) {
            errors.push(`rule ${ruleId} event action has invalid id shape: ${eventId}`);
          } else if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_V1_BY_ID, eventId.toLowerCase())) {
            errors.push(`rule ${ruleId} event action references unknown event id: ${eventId}`);
          }
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
