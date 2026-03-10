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

function pushUnsupportedKeys(errors, context, obj, allowedKeys) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(asObj(obj))) {
    if (!allowed.has(key)) errors.push(`${context} contains unsupported key: ${key}`);
  }
}

function normalizeConditionId(type, idRaw) {
  const id = asText(idRaw).toLowerCase();
  const t = asText(type).toLowerCase();
  if (!id || !t) return "";
  const pref = `${t}.`;
  return id.startsWith(pref) ? id.slice(pref.length) : id;
}

function getQualifiedPrefix(idRaw) {
  const id = asText(idRaw).toLowerCase();
  const dot = id.indexOf(".");
  if (dot <= 0) return "";
  return id.slice(0, dot);
}

function isBareNamespaceId(idRaw) {
  return /^[a-z_]+\.$/.test(asText(idRaw).toLowerCase());
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
  pushUnsupportedKeys(errors, "INTERACTIONS_V2", cfg, ["version", "enabled", "defaults", "rules"]);

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
    pushUnsupportedKeys(errors, "INTERACTIONS_V2.defaults", defaults, ["wakeWin", "event"]);
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
      const seenDefaultEventIds = new Set();
      for (const [eventId, eventArgs] of Object.entries(eventDefaults)) {
        const normalizedEventId = normalizeEventId(eventId);
        const eventQualifiedPrefix = getQualifiedPrefix(eventId);
        if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
          errors.push(
            `INTERACTIONS_V2.defaults.event key prefix mismatch: ${eventId} (expected event.* or unqualified id)`
          );
        } else if (!isEntityIdLike(normalizedEventId)) {
          if (isBareNamespaceId(eventId)) {
            errors.push(`INTERACTIONS_V2.defaults.event key is incomplete: ${eventId} (missing value after prefix)`);
          } else {
            errors.push(`INTERACTIONS_V2.defaults.event key has invalid id shape: ${eventId}`);
          }
        } else if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_V1_BY_ID, normalizedEventId)) {
          errors.push(`INTERACTIONS_V2.defaults.event references unknown event id: ${eventId}`);
        } else if (seenDefaultEventIds.has(normalizedEventId)) {
          errors.push(`INTERACTIONS_V2.defaults.event contains duplicate normalized key: ${eventId}`);
        } else {
          seenDefaultEventIds.add(normalizedEventId);
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
    pushUnsupportedKeys(errors, `rule ${ruleId}`, r, ["id", "on", "then", "enabled", "priority"]);
    if (Object.prototype.hasOwnProperty.call(r, "enabled") && typeof r.enabled !== "boolean") {
      errors.push(`rule ${ruleId} enabled must be boolean when present`);
    }
    if (Object.prototype.hasOwnProperty.call(r, "priority") && !Number.isFinite(Number(r.priority))) {
      errors.push(`rule ${ruleId} priority must be a finite number when present`);
    }

    const on = asObj(r.on);
    pushUnsupportedKeys(errors, `rule ${ruleId} on`, on, ["all"]);
    if (!Array.isArray(on.all) || !on.all.length) {
      errors.push(`rule ${ruleId} must define on.all[]`);
    } else {
      const seenConditions = new Set();
      for (const c of on.all) {
        const cond = asObj(c);
        pushUnsupportedKeys(errors, `rule ${ruleId} condition`, cond, ["type", "id"]);
        const type = asText(cond.type).toLowerCase();
        const id = asText(cond.id);
        const normalizedId = normalizeConditionId(type, id);
        if (!type) errors.push(`rule ${ruleId} has on.all condition missing type`);
        if (!id) errors.push(`rule ${ruleId} has on.all condition missing id`);
        const condKey = `${type}:${normalizedId}`;
        if (type && id) {
          if (seenConditions.has(condKey)) {
            errors.push(`rule ${ruleId} contains duplicate on.all condition: ${type}.${id}`);
          }
          seenConditions.add(condKey);
        }
        if (type && type !== "spell" && type !== "gesture" && type !== "orb_state") {
          errors.push(`rule ${ruleId} has unsupported on.all condition type: ${type}`);
        }
        const qualifiedPrefix = getQualifiedPrefix(id);
        if (type && qualifiedPrefix && qualifiedPrefix !== type) {
          errors.push(
            `rule ${ruleId} condition type/id prefix mismatch: type=${type} id=${id} (expected ${type}.* or unqualified id)`
          );
        }
        if (id && !isEntityIdLike(normalizedId)) {
          if (isBareNamespaceId(id)) {
            errors.push(`rule ${ruleId} has incomplete on.all id: ${id} (missing value after prefix)`);
          } else {
            errors.push(`rule ${ruleId} has invalid on.all id shape (use letters/numbers/_): ${id}`);
          }
        }
        if (type === "spell" && id && !Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedId)) {
          errors.push(`rule ${ruleId} references inactive or unknown spell id: ${id}`);
        }
        if (type === "gesture" && id && !KNOWN_GESTURE_IDS.has(normalizedId)) {
          errors.push(`rule ${ruleId} references unknown gesture id: ${id}`);
        }
        if (type === "orb_state" && id && !KNOWN_ORB_STATE_IDS.has(normalizedId)) {
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
        if (Object.prototype.hasOwnProperty.call(action, "enabled") && typeof action.enabled !== "boolean") {
          errors.push(`rule ${ruleId} action enabled must be boolean when present`);
        }
        if (type !== "wake_win" && type !== "event") {
          errors.push(`rule ${ruleId} has unsupported action type: ${type || "(empty)"}`);
          continue;
        }
        if (type === "wake_win") {
          if (Object.prototype.hasOwnProperty.call(action, "ms")) {
            errors.push(`rule ${ruleId} wake_win should use ttlMs, not ms`);
          }
          for (const key of Object.keys(action)) {
            const allowed = new Set(["type", "spells", "ttlMs", "enabled"]);
            if (!allowed.has(key)) {
              errors.push(`rule ${ruleId} wake_win contains unsupported key: ${key}`);
            }
          }
          if (!Array.isArray(action.spells) || !action.spells.length) {
            errors.push(`rule ${ruleId} wake_win action requires spells[]`);
          } else {
            const seenWakeWinSpells = new Set();
            for (const spellId of action.spells) {
              const id = asText(spellId);
              const normalizedSpellId = normalizeSpellId(id);
              const spellQualifiedPrefix = getQualifiedPrefix(id);
              if (spellQualifiedPrefix && spellQualifiedPrefix !== "spell") {
                errors.push(
                  `rule ${ruleId} wake_win spell prefix mismatch: ${id} (expected spell.* or unqualified id)`
                );
              }
              if (!isEntityIdLike(id)) {
                if (!isEntityIdLike(normalizedSpellId)) {
                  errors.push(`rule ${ruleId} wake_win spell has invalid id shape: ${id}`);
                  continue;
                }
              }
              if (!normalizedSpellId) {
                if (isBareNamespaceId(id)) {
                  errors.push(`rule ${ruleId} wake_win spell id is incomplete: ${id} (missing value after prefix)`);
                } else {
                  errors.push(`rule ${ruleId} wake_win spell id is empty`);
                }
                continue;
              }
              if (seenWakeWinSpells.has(normalizedSpellId)) {
                errors.push(`rule ${ruleId} wake_win contains duplicate spell id: ${id}`);
              }
              seenWakeWinSpells.add(normalizedSpellId);
              if (!Object.prototype.hasOwnProperty.call(SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID, normalizedSpellId)) {
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
          const normalizedEventId = normalizeEventId(eventId);
          const eventQualifiedPrefix = getQualifiedPrefix(eventId);
          if (!eventId) {
            errors.push(`rule ${ruleId} event action requires id`);
          } else if (eventQualifiedPrefix && eventQualifiedPrefix !== "event") {
            errors.push(
              `rule ${ruleId} event id prefix mismatch: ${eventId} (expected event.* or unqualified id)`
            );
          } else if (!isEntityIdLike(normalizedEventId)) {
            if (isBareNamespaceId(eventId)) {
              errors.push(`rule ${ruleId} event action id is incomplete: ${eventId} (missing value after prefix)`);
            } else {
              errors.push(`rule ${ruleId} event action has invalid id shape: ${eventId}`);
            }
          } else if (!Object.prototype.hasOwnProperty.call(EVENT_DEFINITIONS_V1_BY_ID, normalizedEventId)) {
            errors.push(`rule ${ruleId} event action references unknown event id: ${eventId}`);
          }
          if (Object.prototype.hasOwnProperty.call(action, "overrides")) {
            const overrides = action.overrides;
            if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
              errors.push(`rule ${ruleId} event action overrides must be an object when present`);
            } else {
              for (const key of Object.keys(overrides)) {
                if (!key) errors.push(`rule ${ruleId} event action overrides contains empty key`);
                if (Object.prototype.hasOwnProperty.call(action, key)) {
                  errors.push(`rule ${ruleId} event action has duplicate key in root and overrides: ${key}`);
                }
              }
            }
          }
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
