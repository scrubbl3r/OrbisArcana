import { EVENT_DEFINITIONS_V1_BY_ID } from "./event-definitions-v1.js";
import { SIGNAL_DEFINITIONS_V1, SIGNAL_DEFINITIONS_V1_BY_ID } from "./signal-definitions-v1.js";
import { WINDOW_DEFINITIONS_V1_BY_ID } from "./window-definitions-v1.js";

const DEFAULT_WAKE_WINDOW_ID = "wake_win";

function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function isFiniteNonNegativeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
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

function mergeActionOverrides(action) {
  const base = (action && typeof action.overrides === "object" && action.overrides)
    ? { ...action.overrides }
    : {};
  if (action && Object.prototype.hasOwnProperty.call(action, "ttlMs")) base.ttlMs = action.ttlMs;
  if (action && Object.prototype.hasOwnProperty.call(action, "ms")) base.ms = action.ms;
  if (action && Object.prototype.hasOwnProperty.call(action, "state")) base.state = action.state;
  return base;
}

/**
 * Lightweight schema validation for Rule Engine v1 data files.
 * Returns errors only; caller decides whether to throw or log.
 */
export function validateSpellRulesV1(rules = []) {
  const errors = [];
  const seenRuleIds = new Set();
  const seenSignalIds = new Set();
  for (const signal of Array.isArray(SIGNAL_DEFINITIONS_V1) ? SIGNAL_DEFINITIONS_V1 : []) {
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
  for (const signalId of Object.keys(SIGNAL_DEFINITIONS_V1_BY_ID)) {
    const signal = SIGNAL_DEFINITIONS_V1_BY_ID[signalId] || null;
    const sourceEvent = String(signal && signal.sourceEvent || "").trim();
    if (!sourceEvent) {
      errors.push(`signal ${signalId} missing sourceEvent`);
    }
    const where = signal && signal.where;
    if (where && typeof where === "object") {
      if (!String(where.path || "").trim()) {
        errors.push(`signal ${signalId} where.path is required when where is present`);
      }
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

    const on = rule && rule.on;
    const all = Array.isArray(on && on.all) ? on.all : [];
    const any = Array.isArray(on && on.any) ? on.any : [];
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
      if (!signalId || !SIGNAL_DEFINITIONS_V1_BY_ID[signalId]) {
        const rawId = asId(cond && cond.id) || "(empty)";
        errors.push(`rule ${ruleId} references unknown signal: ${rawId} (resolved: ${signalId || "(empty)"})`);
      }
    }

    const actions = Array.isArray(rule && rule.then) ? rule.then : [];
    if (!actions.length) {
      errors.push(`rule ${ruleId} has no actions`);
      continue;
    }

    for (const action of actions) {
      const type = asId(action && action.type);
      const id = asId(action && action.id);
      if (type === "wake_win") {
        const wakeWindowId = asId(id || DEFAULT_WAKE_WINDOW_ID);
        if (!wakeWindowId || !WINDOW_DEFINITIONS_V1_BY_ID[wakeWindowId]) {
          errors.push(`rule ${ruleId} references unknown wake window: ${wakeWindowId || "(empty)"}`);
        }
        const spells = Array.isArray(action && action.spells) ? action.spells : [];
        if (!spells.length) {
          errors.push(`rule ${ruleId} wake_win action requires non-empty spells[]`);
        }
        const overrides = mergeActionOverrides(action);
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
        if (!id || !EVENT_DEFINITIONS_V1_BY_ID[id]) {
          errors.push(`rule ${ruleId} references unknown event: ${id || "(empty)"}`);
          continue;
        }
        const overrides = mergeActionOverrides(action);
        if (overrides && Object.keys(overrides).length > 0) {
          const keys = Object.keys(overrides);
          const unknown = keys.filter((k) => k !== "ms" && k !== "state");
          if (unknown.length) {
            errors.push(`rule ${ruleId} event ${id} has unsupported override keys: ${unknown.join(",")}`);
          }
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
