import { EVENT_DEFINITIONS_BY_ID } from "./event-definitions.js";
import { SIGNAL_DEFINITIONS, SIGNAL_DEFINITIONS_BY_ID } from "./signal-definitions.js";
import { WINDOW_DEFINITIONS_BY_ID } from "./window-definitions.js";

const DEFAULT_WAKE_WINDOW_ID = "wake_win";

function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function isFiniteNonNegativeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

function isFiniteNumber(v) {
  return Number.isFinite(Number(v));
}

function validateWhereClause(where, label, errors) {
  if (!where || typeof where !== "object") return;
  if (Array.isArray(where)) {
    errors.push(`${label} where must be an object (arrays not supported)`);
    return;
  }
  const allowedWhereKeys = new Set(["path", "eq", "gt", "gte", "lt", "lte"]);
  for (const key of Object.keys(where)) {
    if (allowedWhereKeys.has(String(key || ""))) continue;
    errors.push(`${label} where has unsupported key: ${key}`);
  }
  if (Object.prototype.hasOwnProperty.call(where, "path") && typeof where.path !== "string") {
    errors.push(`${label} where.path must be a string`);
  }
  if (!String(where.path || "").trim()) {
    errors.push(`${label} where.path is required when where is present`);
  }
  const hasEq = Object.prototype.hasOwnProperty.call(where, "eq");
  const hasGt = Object.prototype.hasOwnProperty.call(where, "gt");
  const hasGte = Object.prototype.hasOwnProperty.call(where, "gte");
  const hasLt = Object.prototype.hasOwnProperty.call(where, "lt");
  const hasLte = Object.prototype.hasOwnProperty.call(where, "lte");
  if (!hasEq && !hasGt && !hasGte && !hasLt && !hasLte) {
    errors.push(`${label} where requires at least one comparator (eq|gt|gte|lt|lte)`);
  }
  if (hasEq && (hasGt || hasGte || hasLt || hasLte)) {
    errors.push(`${label} where.eq cannot be combined with numeric comparators`);
  }
  if (hasEq && where.eq === undefined) {
    errors.push(`${label} where.eq must not be undefined`);
  }
  if (hasGt && hasGte) {
    errors.push(`${label} where.gt and where.gte cannot be combined`);
  }
  if (hasLt && hasLte) {
    errors.push(`${label} where.lt and where.lte cannot be combined`);
  }
  if (hasGt && !isFiniteNumber(where.gt)) {
    errors.push(`${label} where.gt must be a finite number`);
  }
  if (hasGte && !isFiniteNumber(where.gte)) {
    errors.push(`${label} where.gte must be a finite number`);
  }
  if (hasLt && !isFiniteNumber(where.lt)) {
    errors.push(`${label} where.lt must be a finite number`);
  }
  if (hasLte && !isFiniteNumber(where.lte)) {
    errors.push(`${label} where.lte must be a finite number`);
  }
  const lower = hasGt
    ? Number(where.gt)
    : (hasGte ? Number(where.gte) : null);
  const upper = hasLt
    ? Number(where.lt)
    : (hasLte ? Number(where.lte) : null);
  if (lower !== null && upper !== null && Number.isFinite(lower) && Number.isFinite(upper) && lower > upper) {
    errors.push(`${label} where lower bound cannot be greater than upper bound`);
  }
}

function resolveSignalConditionId(cond) {
  const type = asId(cond && cond.type);
  const id = asId(cond && cond.id);
  if (!id) return "";
  if (type === "signal") return id;
  if (type === "spell" || type === "gesture" || type === "orb_state") {
    if (id.includes(".")) return id;
    return `${type}.${id}`;
  }
  return null;
}

function resolveActionArgs(action) {
  const base = (action && typeof action.overrides === "object" && action.overrides)
    ? { ...action.overrides }
    : {};
  const RESERVED_KEYS = new Set(["type", "id", "spells", "overrides", "enabled"]);
  if (action && typeof action === "object") {
    for (const [k, v] of Object.entries(action)) {
      if (RESERVED_KEYS.has(k)) continue;
      base[k] = v;
    }
  }
  return base;
}

function getRuleConditions(rule) {
  const on = rule && rule.on;
  if (Array.isArray(on)) {
    return { all: on, any: [] };
  }
  if (on && typeof on === "object") {
    if (Array.isArray(on.all) || Array.isArray(on.any)) {
      return {
        all: Array.isArray(on.all) ? on.all : [],
        any: Array.isArray(on.any) ? on.any : [],
      };
    }
    // Treat single condition object as `all: [condition]`.
    if (Object.keys(on).length > 0) {
      return { all: [on], any: [] };
    }
  }
  return { all: [], any: [] };
}

function getRuleActions(rule) {
  const then = rule && rule.then;
  if (Array.isArray(then)) return then;
  if (then && typeof then === "object") return [then];
  return [];
}

function indexDefsById(defs = []) {
  return (Array.isArray(defs) ? defs : []).reduce((acc, item) => {
    const id = asId(item && item.id);
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, Object.create(null));
}

/**
 * Lightweight schema validation for Rule Engine v1 data files.
 * Returns errors only; caller decides whether to throw or log.
 */
export function validateSpellRulesV1(rules = [], options = {}) {
  const signalDefs = Array.isArray(options && options.signals)
    ? options.signals
    : SIGNAL_DEFINITIONS;
  const windowDefs = Array.isArray(options && options.windows)
    ? options.windows
    : Object.values(WINDOW_DEFINITIONS_BY_ID);
  const eventDefs = Array.isArray(options && options.events)
    ? options.events
    : Object.values(EVENT_DEFINITIONS_BY_ID);
  const signalById = (options && options.signalById && typeof options.signalById === "object")
    ? options.signalById
    : (
      Array.isArray(options && options.signals)
        ? indexDefsById(signalDefs)
        : SIGNAL_DEFINITIONS_BY_ID
    );
  const windowById = (options && options.windowById && typeof options.windowById === "object")
    ? options.windowById
    : (
      Array.isArray(options && options.windows)
        ? indexDefsById(options.windows)
        : WINDOW_DEFINITIONS_BY_ID
    );
  const eventById = (options && options.eventById && typeof options.eventById === "object")
    ? options.eventById
    : (
      Array.isArray(options && options.events)
        ? indexDefsById(options.events)
        : EVENT_DEFINITIONS_BY_ID
    );
  const errors = [];
  const seenRuleIds = new Set();
  const seenSignalIds = new Set();
  const seenWindowIds = new Set();
  const seenEventIds = new Set();
  for (const signal of Array.isArray(signalDefs) ? signalDefs : []) {
    const signalId = asId(signal && signal.id);
    if (!signalId) {
      errors.push("signal has missing id");
      continue;
    }
    if (seenSignalIds.has(signalId)) {
      errors.push(`duplicate signal id: ${signalId}`);
      continue;
    }
    seenSignalIds.add(signalId);
  }
  for (const windowDef of Array.isArray(windowDefs) ? windowDefs : []) {
    const windowId = asId(windowDef && windowDef.id);
    if (!windowId) {
      errors.push("window has missing id");
      continue;
    }
    if (seenWindowIds.has(windowId)) {
      errors.push(`duplicate window id: ${windowId}`);
      continue;
    }
    seenWindowIds.add(windowId);
  }
  for (const eventDef of Array.isArray(eventDefs) ? eventDefs : []) {
    const eventId = asId(eventDef && eventDef.id);
    if (!eventId) {
      errors.push("event has missing id");
      continue;
    }
    if (seenEventIds.has(eventId)) {
      errors.push(`duplicate event id: ${eventId}`);
      continue;
    }
    seenEventIds.add(eventId);
  }
  for (const signalId of Object.keys(signalById)) {
    const signal = signalById[signalId] || null;
    const sourceEvent = String(signal && signal.sourceEvent || "").trim();
    if (!sourceEvent) {
      errors.push(`signal ${signalId} missing sourceEvent`);
    }
    const where = signal && signal.where;
    if (where && typeof where === "object") {
      validateWhereClause(where, `signal ${signalId}`, errors);
    }
  }

  for (const rule of Array.isArray(rules) ? rules : []) {
    const ruleId = asId(rule && rule.id);
    if (!ruleId) {
      errors.push("rule has missing id");
      continue;
    }
    if (seenRuleIds.has(ruleId)) {
      errors.push(`duplicate rule id: ${ruleId}`);
    }
    seenRuleIds.add(ruleId);
    if (Object.prototype.hasOwnProperty.call(rule || {}, "enabled")) {
      if (typeof rule.enabled !== "boolean") {
        errors.push(`rule ${ruleId} enabled must be boolean when present`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(rule || {}, "priority")) {
      if (!isFiniteNumber(rule.priority)) {
        errors.push(`rule ${ruleId} priority must be a finite number when present`);
      }
    }

    const { all, any } = getRuleConditions(rule);
    if (!all.length && !any.length) {
      errors.push(`rule ${ruleId} has no triggers (on.all/on.any)`);
    }

    for (const cond of all.concat(any)) {
      const type = asId(cond && cond.type);
      const signalId = resolveSignalConditionId(cond);
      if (signalId === null) {
        errors.push(`rule ${ruleId} has unsupported condition type: ${type || "(empty)"}`);
        continue;
      }
      if (!signalId || !signalById[signalId]) {
        const rawId = asId(cond && cond.id) || "(empty)";
        errors.push(`rule ${ruleId} references unknown signal: ${rawId} (resolved: ${signalId || "(empty)"})`);
      }
    }

    const actions = getRuleActions(rule);
    if (!actions.length) {
      errors.push(`rule ${ruleId} has no actions`);
      continue;
    }

    for (const action of actions) {
      if (Object.prototype.hasOwnProperty.call(action || {}, "enabled")) {
        if (typeof action.enabled !== "boolean") {
          errors.push(`rule ${ruleId} action enabled must be boolean when present`);
          continue;
        }
        if (action.enabled === false) continue;
      }
      const type = asId(action && action.type);
      const id = asId(action && action.id);
      if (type === "wake_win") {
        const wakeWindowId = asId(id || DEFAULT_WAKE_WINDOW_ID);
        if (!wakeWindowId || !windowById[wakeWindowId]) {
          errors.push(`rule ${ruleId} references unknown wake window: ${wakeWindowId || "(empty)"}`);
        }
        const spells = Array.isArray(action && action.spells) ? action.spells : [];
        if (!spells.length) {
          errors.push(`rule ${ruleId} wake_win action requires non-empty spells[]`);
        }
        const overrides = resolveActionArgs(action);
        if (overrides && Object.prototype.hasOwnProperty.call(overrides, "ms")) {
          errors.push(`rule ${ruleId} wake_win should use ttlMs, not ms`);
        }
        if (overrides && Object.prototype.hasOwnProperty.call(overrides, "ttlMs")) {
          if (!isFiniteNonNegativeNumber(overrides.ttlMs)) {
            errors.push(`rule ${ruleId} wake_win ttlMs override must be >= 0`);
          }
        }
        continue;
      }
      if (type === "event") {
        if (!id || !eventById[id]) {
          errors.push(`rule ${ruleId} references unknown event: ${id || "(empty)"}`);
          continue;
        }
        const overrides = resolveActionArgs(action);
        if (overrides && Object.keys(overrides).length > 0) {
          if (Object.prototype.hasOwnProperty.call(overrides, "ms")) {
            if (!isFiniteNonNegativeNumber(overrides.ms)) {
              errors.push(`rule ${ruleId} event ${id} ms override must be >= 0`);
            }
          }
        }
        continue;
      }
      errors.push(`rule ${ruleId} has unsupported action type: ${type || "(empty)"}`);
    }
  }

  return errors;
}

export const validateSpellRules = validateSpellRulesV1;
