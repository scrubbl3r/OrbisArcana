import { EVENT_DEFINITIONS_V1 } from "./event-definitions-v1.js";
import { EVENT_RUNTIME_BINDINGS_V1_BY_ID } from "./event-runtime-bindings-v1.js";
import { SIGNAL_DEFINITIONS_V1 } from "./signal-definitions-v1.js";
import { SPELL_RULES_V1 } from "./spell-rules-v1.js";
import { WINDOW_DEFINITIONS_V1 } from "./window-definitions-v1.js";

const RULE_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: false,
});

const SIGNAL_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // "gesture.y_spin": false,
});

const SIGNAL_DEBOUNCE_OVERRIDES = Object.freeze({
  // Example:
  // "gesture.y_spin": 250,
});

const SIGNAL_MAX_MATCHES_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": 1,
});

const SIGNAL_EMIT_PREVIEW_MATCHED_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": false,
});

const SIGNAL_STOP_ON_FIRST_MATCH_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": true,
});

const SIGNAL_EXECUTE_ACTIONS_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": false,
});

const SIGNAL_ACTION_TYPE_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": { wake_win: false, event: true },
});

const SIGNAL_MATCH_WINDOW_SCALE_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": 0.75,
});

const SIGNAL_COOLDOWN_SCALE_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": 0.5,
});

const SIGNAL_MAX_ACTIONS_PER_RULE_MATCH_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": 1,
});

const SIGNAL_MAX_RULES_EVALUATED_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": 8,
});

const SIGNAL_PRIORITY_OVERRIDES = Object.freeze({
  // Example:
  // "gesture.y_spin": 30,
});

const SIGNAL_WHERE_OVERRIDES = Object.freeze({
  // Example:
  // "orb_state.charged": { path: "ms", gte: 100 },
});

const SIGNAL_SOURCE_EVENT_OVERRIDES = Object.freeze({
  // Example:
  // "spell.rota": "voice.spell_recognized",
});

const SOURCE_EVENT_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": false,
});

const SOURCE_EVENT_DEBOUNCE_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 150,
});

const SOURCE_EVENT_MAX_SIGNALS_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 1,
});

const SOURCE_EVENT_MAX_RULES_EVALUATED_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 8,
});

const SOURCE_EVENT_MAX_MATCHES_PER_EVENT_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 2,
});

const SOURCE_EVENT_STOP_ON_FIRST_SIGNAL_MATCH_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": true,
});

const SOURCE_EVENT_EMIT_PREVIEW_MATCHED_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": false,
});

const SOURCE_EVENT_ACTION_TYPE_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": { wake_win: false, event: true },
});

const SOURCE_EVENT_EXECUTE_ACTIONS_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": false,
});

const SOURCE_EVENT_COOLDOWN_SCALE_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 0.75,
});

const SOURCE_EVENT_MATCH_WINDOW_SCALE_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 1.25,
});

const SOURCE_EVENT_MAX_ACTIONS_PER_RULE_MATCH_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 1,
});

const SOURCE_EVENT_STOP_ON_FIRST_MATCH_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": true,
});

const SOURCE_EVENT_MAX_MATCHES_PER_SIGNAL_OVERRIDES = Object.freeze({
  // Example:
  // "voice.spell_detected": 1,
});

const ACTION_ENABLED_OVERRIDES = Object.freeze({
  // Examples:
  // "r_rota_yspin_charged.event.orb_state": false,
  // "r_rota_yspin_charged.3": false, // by action index
});

const ACTION_ARG_OVERRIDES = Object.freeze({
  // Examples:
  // "r_rota_yspin_charged.event.grace": { ms: 650 },
  // "r_rota_yspin_charged.wake_win.0": { ttlMs: 1800 },
});

const EVENT_DEFAULT_OVERRIDES = Object.freeze({
  // Examples:
  // grace: { ms: 600 },
  // electric_aoe: { ms: 1000, range: 16 },
});

const EVENT_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // grace: false,
});

const WINDOW_DEFAULT_OVERRIDES = Object.freeze({
  // Example:
  // wake_win: { ttlMs: 1800 },
});

const WINDOW_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // wake_win: false,
});

const RULE_DEFAULTS = Object.freeze({
  // Examples:
  // cooldownMs: 0,
  // matchWindowMs: 2000,
  // priority: 0,
});

const RULE_PRIORITY_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: 50,
});

const RULE_TIMING_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: { cooldownMs: 100, matchWindowMs: 2500 },
});

const RULE_ACTION_LIMIT_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: 2,
});

const RULE_COOLDOWN_SCALE_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: 0.5,
});

const RULE_MATCH_WINDOW_SCALE_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: 1.5,
});

const RULE_EMIT_PREVIEW_MATCHED_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: false,
});

const RULE_EXECUTE_ACTIONS_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: false,
});

const RULE_ACTION_TYPE_ENABLED_OVERRIDES = Object.freeze({
  // Example:
  // r_rota_yspin_charged: { wake_win: false, event: true },
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

function applySignalEnabledOverrides(signals = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(signals) ? signals : []).map((signal) => {
    const id = String(signal && signal.id || "").trim().toLowerCase();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return signal;
    const override = map[id];
    if (typeof override !== "boolean") return signal;
    return Object.freeze({
      ...(signal || {}),
      enabled: override,
    });
  });
}

function applySignalPriorityOverrides(signals = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(signals) ? signals : []).map((signal) => {
    const id = String(signal && signal.id || "").trim().toLowerCase();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return signal;
    const override = map[id];
    if (!Number.isFinite(Number(override))) return signal;
    return Object.freeze({
      ...(signal || {}),
      priority: Number(override),
    });
  });
}

function applySignalWhereOverrides(signals = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(signals) ? signals : []).map((signal) => {
    const id = String(signal && signal.id || "").trim().toLowerCase();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return signal;
    const patch = map[id];
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return signal;
    const baseWhere = (signal && signal.where && typeof signal.where === "object")
      ? signal.where
      : Object.create(null);
    return Object.freeze({
      ...(signal || {}),
      where: Object.freeze({
        ...baseWhere,
        ...patch,
      }),
    });
  });
}

function applySignalSourceEventOverrides(signals = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(signals) ? signals : []).map((signal) => {
    const id = String(signal && signal.id || "").trim().toLowerCase();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return signal;
    const sourceEvent = String(map[id] || "").trim();
    if (!sourceEvent) return signal;
    return Object.freeze({
      ...(signal || {}),
      sourceEvent,
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

function applyRuleDefaults(rules = [], defaults = {}) {
  const d = (defaults && typeof defaults === "object") ? defaults : Object.create(null);
  const hasCooldown = Object.prototype.hasOwnProperty.call(d, "cooldownMs");
  const hasMatchWindow = Object.prototype.hasOwnProperty.call(d, "matchWindowMs");
  const hasPriority = Object.prototype.hasOwnProperty.call(d, "priority");
  if (!hasCooldown && !hasMatchWindow && !hasPriority) return Array.isArray(rules) ? rules : [];
  return (Array.isArray(rules) ? rules : []).map((rule) => {
    const next = { ...(rule || {}) };
    if (hasCooldown && !Object.prototype.hasOwnProperty.call(next, "cooldownMs")) {
      next.cooldownMs = d.cooldownMs;
    }
    if (hasMatchWindow && !Object.prototype.hasOwnProperty.call(next, "matchWindowMs")) {
      next.matchWindowMs = d.matchWindowMs;
    }
    if (hasPriority && !Object.prototype.hasOwnProperty.call(next, "priority")) {
      next.priority = d.priority;
    }
    return Object.freeze(next);
  });
}

function applyRulePriorityOverrides(rules = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(rules) ? rules : []).map((rule) => {
    const id = String(rule && rule.id || "").trim();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return rule;
    const override = map[id];
    if (!Number.isFinite(Number(override))) return rule;
    return Object.freeze({
      ...(rule || {}),
      priority: Number(override),
    });
  });
}

function applyRuleTimingOverrides(rules = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(rules) ? rules : []).map((rule) => {
    const id = String(rule && rule.id || "").trim();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return rule;
    const patch = map[id];
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) return rule;
    const next = { ...(rule || {}) };
    if (Object.prototype.hasOwnProperty.call(patch, "cooldownMs") && Number.isFinite(Number(patch.cooldownMs))) {
      next.cooldownMs = Number(patch.cooldownMs);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "matchWindowMs") && Number.isFinite(Number(patch.matchWindowMs))) {
      next.matchWindowMs = Number(patch.matchWindowMs);
    }
    return Object.freeze(next);
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

function applyDefinitionEnabledOverrides(defs = [], overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  return (Array.isArray(defs) ? defs : []).map((def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id || !Object.prototype.hasOwnProperty.call(map, id)) return def;
    const enabled = map[id];
    if (typeof enabled !== "boolean") return def;
    return Object.freeze({
      ...(def || {}),
      enabled,
    });
  });
}

// Canonical SSOT for authoring Rule Engine V1 content.
export const RULE_ENGINE_V1_MASTER_CONTROL = Object.freeze({
  id: "rule_engine_v1",
  version: "v1",
  enabled: true,
  execution: Object.freeze({
    stopOnFirstMatch: false,
    maxRulesEvaluatedPerSignal: 0,
    maxMatchesPerSignal: 0,
    maxMatchesPerEvent: 0,
    maxSignalsPerEvent: 0,
    maxActionsPerRuleMatch: 0,
    sourceEventDebounceMs: 0,
    emitPreviewMatchedEvents: true,
    executeActions: true,
    actionTypeEnabled: Object.freeze({
      wake_win: true,
      event: true,
    }),
    cooldownScale: 1,
    matchWindowScale: 1,
    signalDebounceMs: 0,
    stopOnFirstSignalMatchPerEvent: false,
  }),
  ruleDefaults: RULE_DEFAULTS,
  rulePriorityOverrides: RULE_PRIORITY_OVERRIDES,
  ruleTimingOverrides: RULE_TIMING_OVERRIDES,
  ruleActionLimitOverrides: RULE_ACTION_LIMIT_OVERRIDES,
  ruleCooldownScaleOverrides: RULE_COOLDOWN_SCALE_OVERRIDES,
  ruleMatchWindowScaleOverrides: RULE_MATCH_WINDOW_SCALE_OVERRIDES,
  ruleEmitPreviewMatchedOverrides: RULE_EMIT_PREVIEW_MATCHED_OVERRIDES,
  ruleExecuteActionsOverrides: RULE_EXECUTE_ACTIONS_OVERRIDES,
  ruleActionTypeEnabledOverrides: RULE_ACTION_TYPE_ENABLED_OVERRIDES,
  signalEnabledOverrides: SIGNAL_ENABLED_OVERRIDES,
  signalDebounceOverrides: SIGNAL_DEBOUNCE_OVERRIDES,
  signalMaxMatchesOverrides: SIGNAL_MAX_MATCHES_OVERRIDES,
  signalEmitPreviewMatchedOverrides: SIGNAL_EMIT_PREVIEW_MATCHED_OVERRIDES,
  signalStopOnFirstMatchOverrides: SIGNAL_STOP_ON_FIRST_MATCH_OVERRIDES,
  signalExecuteActionsOverrides: SIGNAL_EXECUTE_ACTIONS_OVERRIDES,
  signalActionTypeEnabledOverrides: SIGNAL_ACTION_TYPE_ENABLED_OVERRIDES,
  signalMatchWindowScaleOverrides: SIGNAL_MATCH_WINDOW_SCALE_OVERRIDES,
  signalCooldownScaleOverrides: SIGNAL_COOLDOWN_SCALE_OVERRIDES,
  signalMaxActionsPerRuleMatchOverrides: SIGNAL_MAX_ACTIONS_PER_RULE_MATCH_OVERRIDES,
  signalMaxRulesEvaluatedOverrides: SIGNAL_MAX_RULES_EVALUATED_OVERRIDES,
  signalPriorityOverrides: SIGNAL_PRIORITY_OVERRIDES,
  signalSourceEventOverrides: SIGNAL_SOURCE_EVENT_OVERRIDES,
  signalWhereOverrides: SIGNAL_WHERE_OVERRIDES,
  sourceEventEnabledOverrides: SOURCE_EVENT_ENABLED_OVERRIDES,
  sourceEventDebounceOverrides: SOURCE_EVENT_DEBOUNCE_OVERRIDES,
  sourceEventMaxSignalsOverrides: SOURCE_EVENT_MAX_SIGNALS_OVERRIDES,
  sourceEventMaxRulesEvaluatedOverrides: SOURCE_EVENT_MAX_RULES_EVALUATED_OVERRIDES,
  sourceEventMaxMatchesPerEventOverrides: SOURCE_EVENT_MAX_MATCHES_PER_EVENT_OVERRIDES,
  sourceEventStopOnFirstSignalMatchOverrides: SOURCE_EVENT_STOP_ON_FIRST_SIGNAL_MATCH_OVERRIDES,
  sourceEventEmitPreviewMatchedOverrides: SOURCE_EVENT_EMIT_PREVIEW_MATCHED_OVERRIDES,
  sourceEventActionTypeEnabledOverrides: SOURCE_EVENT_ACTION_TYPE_ENABLED_OVERRIDES,
  sourceEventExecuteActionsOverrides: SOURCE_EVENT_EXECUTE_ACTIONS_OVERRIDES,
  sourceEventCooldownScaleOverrides: SOURCE_EVENT_COOLDOWN_SCALE_OVERRIDES,
  sourceEventMatchWindowScaleOverrides: SOURCE_EVENT_MATCH_WINDOW_SCALE_OVERRIDES,
  sourceEventMaxActionsPerRuleMatchOverrides: SOURCE_EVENT_MAX_ACTIONS_PER_RULE_MATCH_OVERRIDES,
  sourceEventStopOnFirstMatchOverrides: SOURCE_EVENT_STOP_ON_FIRST_MATCH_OVERRIDES,
  sourceEventMaxMatchesPerSignalOverrides: SOURCE_EVENT_MAX_MATCHES_PER_SIGNAL_OVERRIDES,
  ruleEnabledOverrides: RULE_ENABLED_OVERRIDES,
  actionEnabledOverrides: ACTION_ENABLED_OVERRIDES,
  actionArgOverrides: ACTION_ARG_OVERRIDES,
  eventEnabledOverrides: EVENT_ENABLED_OVERRIDES,
  eventDefaultOverrides: EVENT_DEFAULT_OVERRIDES,
  windowEnabledOverrides: WINDOW_ENABLED_OVERRIDES,
  windowDefaultOverrides: WINDOW_DEFAULT_OVERRIDES,
  signals: applySignalEnabledOverrides(
    applySignalWhereOverrides(
      applySignalPriorityOverrides(
        applySignalSourceEventOverrides(SIGNAL_DEFINITIONS_V1, SIGNAL_SOURCE_EVENT_OVERRIDES),
        SIGNAL_PRIORITY_OVERRIDES
      ),
      SIGNAL_WHERE_OVERRIDES
    ),
    SIGNAL_ENABLED_OVERRIDES
  ),
  windows: applyDefinitionDefaultArgOverrides(
    applyDefinitionEnabledOverrides(WINDOW_DEFINITIONS_V1, WINDOW_ENABLED_OVERRIDES),
    WINDOW_DEFAULT_OVERRIDES
  ),
  events: applyDefinitionDefaultArgOverrides(
    applyDefinitionEnabledOverrides(EVENT_DEFINITIONS_V1, EVENT_ENABLED_OVERRIDES),
    EVENT_DEFAULT_OVERRIDES
  ),
  rules: applyActionEnabledOverrides(
    applyRuleEnabledOverrides(
      applyRulePriorityOverrides(
        applyRuleTimingOverrides(
          applyRuleDefaults(SPELL_RULES_V1, RULE_DEFAULTS),
          RULE_TIMING_OVERRIDES
        ),
        RULE_PRIORITY_OVERRIDES
      ),
      RULE_ENABLED_OVERRIDES
    ),
    ACTION_ENABLED_OVERRIDES
  ),
  eventRuntimeBindings: (EVENT_RUNTIME_BINDINGS_V1_BY_ID && typeof EVENT_RUNTIME_BINDINGS_V1_BY_ID === "object")
    ? { ...EVENT_RUNTIME_BINDINGS_V1_BY_ID }
    : Object.create(null),
});
