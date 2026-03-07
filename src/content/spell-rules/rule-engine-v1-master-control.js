import { EVENT_DEFINITIONS_V1 } from "./event-definitions-v1.js";
import { EVENT_RUNTIME_BINDINGS_V1_BY_ID } from "./event-runtime-bindings-v1.js";
import { SIGNAL_DEFINITIONS_V1 } from "./signal-definitions-v1.js";
import { SPELL_RULES_V1 } from "./spell-rules-v1.js";
import { WINDOW_DEFINITIONS_V1 } from "./window-definitions-v1.js";

const RULE_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: false,
});

const ACTION_ENABLED_OVERRIDES = Object.freeze({
  // Examples:
  // "r_rota_yspin_charged.event.orb_state": false,
  // "r_rota_yspin_charged.3": false, // by action index
});

const EVENT_DEFAULT_OVERRIDES = Object.freeze({
  // Examples:
  // grace: { ms: 600 },
  // electric_aoe: { ms: 1000, range: 16 },
});

const WINDOW_DEFAULT_OVERRIDES = Object.freeze({
  // Example:
  // wake_win: { ttlMs: 1800 },
});

function applyRuleEnabledOverrides(rules = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(rules) ? rules : []).map((rule) => {
    const id = String(rule && rule.id || "").trim();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return rule;
    const override = map[id];
    if (typeof override !== "boolean") return rule;
    return Object.freeze({
      ...rule,
      enabled: override,
    });
  });
}

function asActionType(v) {
  return String(v || "").trim().toLowerCase();
}

function asActionId(v) {
  return String(v || "").trim().toLowerCase();
}

function resolveActionOverride(ruleId, action, index, overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  const type = asActionType(action && action.type);
  const id = asActionId(action && action.id);
  const keys = [];
  if (ruleId && type && id) keys.push(`${ruleId}.${type}.${id}`);
  if (ruleId && type) keys.push(`${ruleId}.${type}.${index}`);
  if (ruleId) keys.push(`${ruleId}.${index}`);
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
    const v = map[key];
    if (typeof v === "boolean") return v;
  }
  return null;
}

function applyActionEnabledOverrides(rules = [], overrides = {}) {
  return (Array.isArray(rules) ? rules : []).map((rule) => {
    const ruleId = String(rule && rule.id || "").trim();
    const actions = Array.isArray(rule && rule.then) ? rule.then : null;
    if (!ruleId || !actions) return rule;
    const nextActions = actions.map((action, index) => {
      const override = resolveActionOverride(ruleId, action, index, overrides);
      if (override == null) return action;
      return Object.freeze({
        ...(action || {}),
        enabled: override,
      });
    });
    return Object.freeze({
      ...(rule || {}),
      then: Object.freeze(nextActions),
    });
  });
}

function applyDefinitionDefaultArgOverrides(defs = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(defs) ? defs : []).map((def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return def;
    const patch = map[id];
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return def;
    const baseArgs = (def && typeof def.defaultArgs === "object" && def.defaultArgs)
      ? def.defaultArgs
      : {};
    return Object.freeze({
      ...(def || {}),
      defaultArgs: Object.freeze({
        ...baseArgs,
        ...patch,
      }),
    });
  });
}

// Canonical SSOT for authoring Rule Engine V1 content.
export const RULE_ENGINE_V1_MASTER_CONTROL = Object.freeze({
  id: "rule_engine_v1",
  version: "v1",
  enabled: true,
  ruleEnabledOverrides: RULE_ENABLED_OVERRIDES,
  actionEnabledOverrides: ACTION_ENABLED_OVERRIDES,
  eventDefaultOverrides: EVENT_DEFAULT_OVERRIDES,
  windowDefaultOverrides: WINDOW_DEFAULT_OVERRIDES,
  signals: Array.isArray(SIGNAL_DEFINITIONS_V1) ? SIGNAL_DEFINITIONS_V1.slice() : [],
  windows: applyDefinitionDefaultArgOverrides(WINDOW_DEFINITIONS_V1, WINDOW_DEFAULT_OVERRIDES),
  events: applyDefinitionDefaultArgOverrides(EVENT_DEFINITIONS_V1, EVENT_DEFAULT_OVERRIDES),
  rules: applyActionEnabledOverrides(
    applyRuleEnabledOverrides(SPELL_RULES_V1, RULE_ENABLED_OVERRIDES),
    ACTION_ENABLED_OVERRIDES
  ),
  eventRuntimeBindings: (EVENT_RUNTIME_BINDINGS_V1_BY_ID && typeof EVENT_RUNTIME_BINDINGS_V1_BY_ID === "object")
    ? { ...EVENT_RUNTIME_BINDINGS_V1_BY_ID }
    : Object.create(null),
});
