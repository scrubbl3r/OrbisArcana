import { buildRuleEngineV1PreviewRuntime } from "../content/spell-rules/index.js";

const EVT_RULE_ENGINE_PREVIEW_MATCHED = "rule_engine.preview_matched";
const EVT_RULE_ENGINE_ACTION_EXECUTED = "rule_engine.action_executed";
const EVT_RULE_ENGINE_SOURCE_EVENT_SUMMARY = "rule_engine.source_event_summary";
const EVT_RULE_ENGINE_WAKE_WIN_OPENED = "rule_engine.wake_win_opened";

// Backward-compatible event IDs emitted in parallel during migration.
const EVT_RULE_ENGINE_V1_PREVIEW_MATCHED = "rule_engine.v1.preview_matched";
const EVT_RULE_ENGINE_V1_ACTION_EXECUTED = "rule_engine.v1.action_executed";
const EVT_RULE_ENGINE_V1_SOURCE_EVENT_SUMMARY = "rule_engine.v1.source_event_summary";

function emitRuleEngineEventCompat(eventBus, modernEvent, legacyEvent, payload = {}) {
  eventBus.emit(modernEvent, payload);
  if (legacyEvent && legacyEvent !== modernEvent) {
    eventBus.emit(legacyEvent, payload);
  }
}

function getByPath(obj, path) {
  const parts = String(path || "").split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

function asActionType(v) {
  return String(v || "").trim().toLowerCase();
}

function asActionId(v) {
  return String(v || "").trim().toLowerCase();
}

function resolveActionArgOverride(ruleId, action, index, overrides = {}) {
  const map = (overrides && typeof overrides === "object") ? overrides : Object.create(null);
  const type = asActionType(action && action.type);
  const id = asActionId(action && action.id);
  const keys = [];
  if (ruleId && type && id) keys.push(`${ruleId}.${type}.${id}`);
  if (ruleId && type) keys.push(`${ruleId}.${type}.${index}`);
  if (ruleId) keys.push(`${ruleId}.${index}`);
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
    const value = map[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  }
  return null;
}

function signalMatchesPayload(signal, payload = {}) {
  const where = signal && signal.where;
  if (!where || typeof where !== "object") return true;
  const value = getByPath(payload, where.path);
  if (Object.prototype.hasOwnProperty.call(where, "eq")) {
    return norm(value) === norm(where.eq);
  }
  if (Object.prototype.hasOwnProperty.call(where, "gt")) {
    return Number(value) > Number(where.gt);
  }
  if (Object.prototype.hasOwnProperty.call(where, "gte")) {
    return Number(value) >= Number(where.gte);
  }
  if (Object.prototype.hasOwnProperty.call(where, "lt")) {
    return Number(value) < Number(where.lt);
  }
  if (Object.prototype.hasOwnProperty.call(where, "lte")) {
    return Number(value) <= Number(where.lte);
  }
  return true;
}

function isSignalRecent(lastSeenAtBySignalId, signalId, now, maxAgeMs) {
  const at = Number(lastSeenAtBySignalId.get(signalId) || 0);
  if (!at) return false;
  return (now - at) <= maxAgeMs;
}

function ruleMatches(runtimeRule, lastSeenAtBySignalId, now, matchWindowScale = 1) {
  const scale = Number.isFinite(Number(matchWindowScale))
    ? Math.max(0, Number(matchWindowScale))
    : 1;
  const maxAgeMs = Math.max(100, (Math.max(100, Number(runtimeRule && runtimeRule.matchWindowMs) || 2000) * scale));
  const all = Array.isArray(runtimeRule && runtimeRule.allSignalIds) ? runtimeRule.allSignalIds : [];
  const any = Array.isArray(runtimeRule && runtimeRule.anySignalIds) ? runtimeRule.anySignalIds : [];
  if (all.length) {
    for (const signalId of all) {
      if (!isSignalRecent(lastSeenAtBySignalId, signalId, now, maxAgeMs)) return false;
    }
  }
  if (any.length) {
    let ok = false;
    for (const signalId of any) {
      if (isSignalRecent(lastSeenAtBySignalId, signalId, now, maxAgeMs)) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

export function createRuleEngineV1PreviewSystem({
  eventBus,
  schema = null,
  executeActions = false,
  nowMs = () => Date.now(),
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createRuleEngineV1PreviewSystem requires eventBus.on/eventBus.emit");
  }
  const runtime = buildRuleEngineV1PreviewRuntime({
    signals: schema && Array.isArray(schema.signals) ? schema.signals : [],
    windows: schema && Array.isArray(schema.windows) ? schema.windows : [],
    events: schema && Array.isArray(schema.events) ? schema.events : [],
    rules: schema && Array.isArray(schema.rules) ? schema.rules : [],
  });
  const execution = (schema && schema.execution && typeof schema.execution === "object")
    ? schema.execution
    : Object.create(null);
  const stopOnFirstMatch = !!execution.stopOnFirstMatch;
  const maxMatchesPerSignalRaw = Number(execution.maxMatchesPerSignal);
  const maxMatchesPerSignal = Number.isFinite(maxMatchesPerSignalRaw)
    ? Math.max(0, Math.floor(maxMatchesPerSignalRaw))
    : 0;
  const maxActionsPerSignalRaw = Number(execution.maxActionsPerSignal);
  const maxActionsPerSignal = Number.isFinite(maxActionsPerSignalRaw)
    ? Math.max(0, Math.floor(maxActionsPerSignalRaw))
    : 0;
  const maxRulesEvaluatedPerSignalRaw = Number(execution.maxRulesEvaluatedPerSignal);
  const maxRulesEvaluatedPerSignal = Number.isFinite(maxRulesEvaluatedPerSignalRaw)
    ? Math.max(0, Math.floor(maxRulesEvaluatedPerSignalRaw))
    : 0;
  const maxRulesEvaluatedPerEventRaw = Number(execution.maxRulesEvaluatedPerEvent);
  const maxRulesEvaluatedPerEvent = Number.isFinite(maxRulesEvaluatedPerEventRaw)
    ? Math.max(0, Math.floor(maxRulesEvaluatedPerEventRaw))
    : 0;
  const maxSignalsPerEventRaw = Number(execution.maxSignalsPerEvent);
  const maxSignalsPerEvent = Number.isFinite(maxSignalsPerEventRaw)
    ? Math.max(0, Math.floor(maxSignalsPerEventRaw))
    : 0;
  const maxSignalsEvaluatedPerEventRaw = Number(execution.maxSignalsEvaluatedPerEvent);
  const maxSignalsEvaluatedPerEvent = Number.isFinite(maxSignalsEvaluatedPerEventRaw)
    ? Math.max(0, Math.floor(maxSignalsEvaluatedPerEventRaw))
    : 0;
  const maxMatchesPerEventRaw = Number(execution.maxMatchesPerEvent);
  const maxMatchesPerEvent = Number.isFinite(maxMatchesPerEventRaw)
    ? Math.max(0, Math.floor(maxMatchesPerEventRaw))
    : 0;
  const maxActionsPerEventRaw = Number(execution.maxActionsPerEvent);
  const maxActionsPerEvent = Number.isFinite(maxActionsPerEventRaw)
    ? Math.max(0, Math.floor(maxActionsPerEventRaw))
    : 0;
  const maxActionsPerRuleMatchRaw = Number(execution.maxActionsPerRuleMatch);
  const maxActionsPerRuleMatch = Number.isFinite(maxActionsPerRuleMatchRaw)
    ? Math.max(0, Math.floor(maxActionsPerRuleMatchRaw))
    : 0;
  const sourceEventDebounceMsRaw = Number(execution.sourceEventDebounceMs);
  const sourceEventDebounceMs = Number.isFinite(sourceEventDebounceMsRaw)
    ? Math.max(0, sourceEventDebounceMsRaw)
    : 0;
  const emitPreviewMatchedEvents = (Object.prototype.hasOwnProperty.call(execution, "emitPreviewMatchedEvents"))
    ? !!execution.emitPreviewMatchedEvents
    : true;
  const emitActionExecutedEvents = (Object.prototype.hasOwnProperty.call(execution, "emitActionExecutedEvents"))
    ? !!execution.emitActionExecutedEvents
    : true;
  const emitSourceEventSummaryEvents = (Object.prototype.hasOwnProperty.call(execution, "emitSourceEventSummaryEvents"))
    ? !!execution.emitSourceEventSummaryEvents
    : false;
  const sourceEventSummaryIncludeSignalAndRuleIds = (Object.prototype.hasOwnProperty.call(execution, "sourceEventSummaryIncludeSignalAndRuleIds"))
    ? !!execution.sourceEventSummaryIncludeSignalAndRuleIds
    : false;
  const sourceEventSummaryIncludeBudgetCaps = (Object.prototype.hasOwnProperty.call(execution, "sourceEventSummaryIncludeBudgetCaps"))
    ? !!execution.sourceEventSummaryIncludeBudgetCaps
    : false;
  const executionAllowsActions = (Object.prototype.hasOwnProperty.call(execution, "executeActions"))
    ? !!execution.executeActions
    : true;
  const actionTypeEnabled = (execution && execution.actionTypeEnabled && typeof execution.actionTypeEnabled === "object")
    ? execution.actionTypeEnabled
    : Object.create(null);
  const actionExecutedEventTypeEnabled = (execution && execution.actionExecutedEventTypeEnabled && typeof execution.actionExecutedEventTypeEnabled === "object")
    ? execution.actionExecutedEventTypeEnabled
    : Object.create(null);
  const cooldownScaleRaw = Number(execution.cooldownScale);
  const cooldownScale = Number.isFinite(cooldownScaleRaw)
    ? Math.max(0, cooldownScaleRaw)
    : 1;
  const matchWindowScaleRaw = Number(execution.matchWindowScale);
  const matchWindowScale = Number.isFinite(matchWindowScaleRaw)
    ? Math.max(0, matchWindowScaleRaw)
    : 1;
  const signalDebounceMsRaw = Number(execution.signalDebounceMs);
  const signalDebounceMs = Number.isFinite(signalDebounceMsRaw)
    ? Math.max(0, signalDebounceMsRaw)
    : 0;
  const stopOnFirstSignalMatchPerEvent = !!execution.stopOnFirstSignalMatchPerEvent;
  const signalDebounceOverrides = (schema && schema.signalDebounceOverrides && typeof schema.signalDebounceOverrides === "object")
    ? schema.signalDebounceOverrides
    : Object.create(null);
  const signalMaxMatchesOverrides = (schema && schema.signalMaxMatchesOverrides && typeof schema.signalMaxMatchesOverrides === "object")
    ? schema.signalMaxMatchesOverrides
    : Object.create(null);
  const signalEmitPreviewMatchedOverrides = (schema && schema.signalEmitPreviewMatchedOverrides && typeof schema.signalEmitPreviewMatchedOverrides === "object")
    ? schema.signalEmitPreviewMatchedOverrides
    : Object.create(null);
  const signalExecuteActionsOverrides = (schema && schema.signalExecuteActionsOverrides && typeof schema.signalExecuteActionsOverrides === "object")
    ? schema.signalExecuteActionsOverrides
    : Object.create(null);
  const signalEmitActionExecutedOverrides = (schema && schema.signalEmitActionExecutedOverrides && typeof schema.signalEmitActionExecutedOverrides === "object")
    ? schema.signalEmitActionExecutedOverrides
    : Object.create(null);
  const signalEmitSourceEventSummaryOverrides = (schema && schema.signalEmitSourceEventSummaryOverrides && typeof schema.signalEmitSourceEventSummaryOverrides === "object")
    ? schema.signalEmitSourceEventSummaryOverrides
    : Object.create(null);
  const signalSummaryIncludeSignalAndRuleIdsOverrides = (schema && schema.signalSummaryIncludeSignalAndRuleIdsOverrides && typeof schema.signalSummaryIncludeSignalAndRuleIdsOverrides === "object")
    ? schema.signalSummaryIncludeSignalAndRuleIdsOverrides
    : Object.create(null);
  const signalSummaryIncludeBudgetCapsOverrides = (schema && schema.signalSummaryIncludeBudgetCapsOverrides && typeof schema.signalSummaryIncludeBudgetCapsOverrides === "object")
    ? schema.signalSummaryIncludeBudgetCapsOverrides
    : Object.create(null);
  const signalActionExecutedEventTypeEnabledOverrides = (schema && schema.signalActionExecutedEventTypeEnabledOverrides && typeof schema.signalActionExecutedEventTypeEnabledOverrides === "object")
    ? schema.signalActionExecutedEventTypeEnabledOverrides
    : Object.create(null);
  const signalActionTypeEnabledOverrides = (schema && schema.signalActionTypeEnabledOverrides && typeof schema.signalActionTypeEnabledOverrides === "object")
    ? schema.signalActionTypeEnabledOverrides
    : Object.create(null);
  const signalMatchWindowScaleOverrides = (schema && schema.signalMatchWindowScaleOverrides && typeof schema.signalMatchWindowScaleOverrides === "object")
    ? schema.signalMatchWindowScaleOverrides
    : Object.create(null);
  const signalCooldownScaleOverrides = (schema && schema.signalCooldownScaleOverrides && typeof schema.signalCooldownScaleOverrides === "object")
    ? schema.signalCooldownScaleOverrides
    : Object.create(null);
  const signalMaxActionsPerRuleMatchOverrides = (schema && schema.signalMaxActionsPerRuleMatchOverrides && typeof schema.signalMaxActionsPerRuleMatchOverrides === "object")
    ? schema.signalMaxActionsPerRuleMatchOverrides
    : Object.create(null);
  const signalMaxRulesEvaluatedOverrides = (schema && schema.signalMaxRulesEvaluatedOverrides && typeof schema.signalMaxRulesEvaluatedOverrides === "object")
    ? schema.signalMaxRulesEvaluatedOverrides
    : Object.create(null);
  const signalMaxActionsPerEventOverrides = (schema && schema.signalMaxActionsPerEventOverrides && typeof schema.signalMaxActionsPerEventOverrides === "object")
    ? schema.signalMaxActionsPerEventOverrides
    : Object.create(null);
  const signalMaxActionsPerSignalOverrides = (schema && schema.signalMaxActionsPerSignalOverrides && typeof schema.signalMaxActionsPerSignalOverrides === "object")
    ? schema.signalMaxActionsPerSignalOverrides
    : Object.create(null);
  const signalMaxMatchesPerEventOverrides = (schema && schema.signalMaxMatchesPerEventOverrides && typeof schema.signalMaxMatchesPerEventOverrides === "object")
    ? schema.signalMaxMatchesPerEventOverrides
    : Object.create(null);
  const signalMaxRulesEvaluatedPerEventOverrides = (schema && schema.signalMaxRulesEvaluatedPerEventOverrides && typeof schema.signalMaxRulesEvaluatedPerEventOverrides === "object")
    ? schema.signalMaxRulesEvaluatedPerEventOverrides
    : Object.create(null);
  const signalMaxSignalsPerEventOverrides = (schema && schema.signalMaxSignalsPerEventOverrides && typeof schema.signalMaxSignalsPerEventOverrides === "object")
    ? schema.signalMaxSignalsPerEventOverrides
    : Object.create(null);
  const signalMaxSignalsEvaluatedPerEventOverrides = (schema && schema.signalMaxSignalsEvaluatedPerEventOverrides && typeof schema.signalMaxSignalsEvaluatedPerEventOverrides === "object")
    ? schema.signalMaxSignalsEvaluatedPerEventOverrides
    : Object.create(null);
  const signalStopOnFirstSignalMatchPerEventOverrides = (schema && schema.signalStopOnFirstSignalMatchPerEventOverrides && typeof schema.signalStopOnFirstSignalMatchPerEventOverrides === "object")
    ? schema.signalStopOnFirstSignalMatchPerEventOverrides
    : Object.create(null);
  const signalStopOnFirstMatchOverrides = (schema && schema.signalStopOnFirstMatchOverrides && typeof schema.signalStopOnFirstMatchOverrides === "object")
    ? schema.signalStopOnFirstMatchOverrides
    : Object.create(null);
  const sourceEventEnabledOverrides = (schema && schema.sourceEventEnabledOverrides && typeof schema.sourceEventEnabledOverrides === "object")
    ? schema.sourceEventEnabledOverrides
    : Object.create(null);
  const sourceEventDebounceOverrides = (schema && schema.sourceEventDebounceOverrides && typeof schema.sourceEventDebounceOverrides === "object")
    ? schema.sourceEventDebounceOverrides
    : Object.create(null);
  const sourceEventMaxSignalsOverrides = (schema && schema.sourceEventMaxSignalsOverrides && typeof schema.sourceEventMaxSignalsOverrides === "object")
    ? schema.sourceEventMaxSignalsOverrides
    : Object.create(null);
  const sourceEventMaxSignalsEvaluatedPerEventOverrides = (schema && schema.sourceEventMaxSignalsEvaluatedPerEventOverrides && typeof schema.sourceEventMaxSignalsEvaluatedPerEventOverrides === "object")
    ? schema.sourceEventMaxSignalsEvaluatedPerEventOverrides
    : Object.create(null);
  const sourceEventMaxActionsPerSignalOverrides = (schema && schema.sourceEventMaxActionsPerSignalOverrides && typeof schema.sourceEventMaxActionsPerSignalOverrides === "object")
    ? schema.sourceEventMaxActionsPerSignalOverrides
    : Object.create(null);
  const sourceEventMaxMatchesPerEventOverrides = (schema && schema.sourceEventMaxMatchesPerEventOverrides && typeof schema.sourceEventMaxMatchesPerEventOverrides === "object")
    ? schema.sourceEventMaxMatchesPerEventOverrides
    : Object.create(null);
  const sourceEventMaxActionsPerEventOverrides = (schema && schema.sourceEventMaxActionsPerEventOverrides && typeof schema.sourceEventMaxActionsPerEventOverrides === "object")
    ? schema.sourceEventMaxActionsPerEventOverrides
    : Object.create(null);
  const sourceEventMaxRulesEvaluatedOverrides = (schema && schema.sourceEventMaxRulesEvaluatedOverrides && typeof schema.sourceEventMaxRulesEvaluatedOverrides === "object")
    ? schema.sourceEventMaxRulesEvaluatedOverrides
    : Object.create(null);
  const sourceEventMaxRulesEvaluatedPerEventOverrides = (schema && schema.sourceEventMaxRulesEvaluatedPerEventOverrides && typeof schema.sourceEventMaxRulesEvaluatedPerEventOverrides === "object")
    ? schema.sourceEventMaxRulesEvaluatedPerEventOverrides
    : Object.create(null);
  const sourceEventStopOnFirstSignalMatchOverrides = (schema && schema.sourceEventStopOnFirstSignalMatchOverrides && typeof schema.sourceEventStopOnFirstSignalMatchOverrides === "object")
    ? schema.sourceEventStopOnFirstSignalMatchOverrides
    : Object.create(null);
  const sourceEventEmitPreviewMatchedOverrides = (schema && schema.sourceEventEmitPreviewMatchedOverrides && typeof schema.sourceEventEmitPreviewMatchedOverrides === "object")
    ? schema.sourceEventEmitPreviewMatchedOverrides
    : Object.create(null);
  const sourceEventEmitActionExecutedOverrides = (schema && schema.sourceEventEmitActionExecutedOverrides && typeof schema.sourceEventEmitActionExecutedOverrides === "object")
    ? schema.sourceEventEmitActionExecutedOverrides
    : Object.create(null);
  const sourceEventEmitSourceEventSummaryOverrides = (schema && schema.sourceEventEmitSourceEventSummaryOverrides && typeof schema.sourceEventEmitSourceEventSummaryOverrides === "object")
    ? schema.sourceEventEmitSourceEventSummaryOverrides
    : Object.create(null);
  const sourceEventSummaryIncludeSignalAndRuleIdsOverrides = (schema && schema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides && typeof schema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides === "object")
    ? schema.sourceEventSummaryIncludeSignalAndRuleIdsOverrides
    : Object.create(null);
  const sourceEventSummaryIncludeBudgetCapsOverrides = (schema && schema.sourceEventSummaryIncludeBudgetCapsOverrides && typeof schema.sourceEventSummaryIncludeBudgetCapsOverrides === "object")
    ? schema.sourceEventSummaryIncludeBudgetCapsOverrides
    : Object.create(null);
  const sourceEventActionTypeEnabledOverrides = (schema && schema.sourceEventActionTypeEnabledOverrides && typeof schema.sourceEventActionTypeEnabledOverrides === "object")
    ? schema.sourceEventActionTypeEnabledOverrides
    : Object.create(null);
  const sourceEventActionExecutedEventTypeEnabledOverrides = (schema && schema.sourceEventActionExecutedEventTypeEnabledOverrides && typeof schema.sourceEventActionExecutedEventTypeEnabledOverrides === "object")
    ? schema.sourceEventActionExecutedEventTypeEnabledOverrides
    : Object.create(null);
  const sourceEventExecuteActionsOverrides = (schema && schema.sourceEventExecuteActionsOverrides && typeof schema.sourceEventExecuteActionsOverrides === "object")
    ? schema.sourceEventExecuteActionsOverrides
    : Object.create(null);
  const sourceEventCooldownScaleOverrides = (schema && schema.sourceEventCooldownScaleOverrides && typeof schema.sourceEventCooldownScaleOverrides === "object")
    ? schema.sourceEventCooldownScaleOverrides
    : Object.create(null);
  const sourceEventMatchWindowScaleOverrides = (schema && schema.sourceEventMatchWindowScaleOverrides && typeof schema.sourceEventMatchWindowScaleOverrides === "object")
    ? schema.sourceEventMatchWindowScaleOverrides
    : Object.create(null);
  const sourceEventMaxActionsPerRuleMatchOverrides = (schema && schema.sourceEventMaxActionsPerRuleMatchOverrides && typeof schema.sourceEventMaxActionsPerRuleMatchOverrides === "object")
    ? schema.sourceEventMaxActionsPerRuleMatchOverrides
    : Object.create(null);
  const sourceEventStopOnFirstMatchOverrides = (schema && schema.sourceEventStopOnFirstMatchOverrides && typeof schema.sourceEventStopOnFirstMatchOverrides === "object")
    ? schema.sourceEventStopOnFirstMatchOverrides
    : Object.create(null);
  const sourceEventMaxMatchesPerSignalOverrides = (schema && schema.sourceEventMaxMatchesPerSignalOverrides && typeof schema.sourceEventMaxMatchesPerSignalOverrides === "object")
    ? schema.sourceEventMaxMatchesPerSignalOverrides
    : Object.create(null);
  const actionArgOverrides = (schema && schema.actionArgOverrides && typeof schema.actionArgOverrides === "object")
    ? schema.actionArgOverrides
    : Object.create(null);
  const ruleActionLimitOverrides = (schema && schema.ruleActionLimitOverrides && typeof schema.ruleActionLimitOverrides === "object")
    ? schema.ruleActionLimitOverrides
    : Object.create(null);
  const ruleCooldownScaleOverrides = (schema && schema.ruleCooldownScaleOverrides && typeof schema.ruleCooldownScaleOverrides === "object")
    ? schema.ruleCooldownScaleOverrides
    : Object.create(null);
  const ruleMatchWindowScaleOverrides = (schema && schema.ruleMatchWindowScaleOverrides && typeof schema.ruleMatchWindowScaleOverrides === "object")
    ? schema.ruleMatchWindowScaleOverrides
    : Object.create(null);
  const ruleEmitPreviewMatchedOverrides = (schema && schema.ruleEmitPreviewMatchedOverrides && typeof schema.ruleEmitPreviewMatchedOverrides === "object")
    ? schema.ruleEmitPreviewMatchedOverrides
    : Object.create(null);
  const ruleEmitActionExecutedOverrides = (schema && schema.ruleEmitActionExecutedOverrides && typeof schema.ruleEmitActionExecutedOverrides === "object")
    ? schema.ruleEmitActionExecutedOverrides
    : Object.create(null);
  const ruleEmitSourceEventSummaryOverrides = (schema && schema.ruleEmitSourceEventSummaryOverrides && typeof schema.ruleEmitSourceEventSummaryOverrides === "object")
    ? schema.ruleEmitSourceEventSummaryOverrides
    : Object.create(null);
  const ruleSummaryIncludeSignalAndRuleIdsOverrides = (schema && schema.ruleSummaryIncludeSignalAndRuleIdsOverrides && typeof schema.ruleSummaryIncludeSignalAndRuleIdsOverrides === "object")
    ? schema.ruleSummaryIncludeSignalAndRuleIdsOverrides
    : Object.create(null);
  const ruleSummaryIncludeBudgetCapsOverrides = (schema && schema.ruleSummaryIncludeBudgetCapsOverrides && typeof schema.ruleSummaryIncludeBudgetCapsOverrides === "object")
    ? schema.ruleSummaryIncludeBudgetCapsOverrides
    : Object.create(null);
  const ruleActionExecutedEventTypeEnabledOverrides = (schema && schema.ruleActionExecutedEventTypeEnabledOverrides && typeof schema.ruleActionExecutedEventTypeEnabledOverrides === "object")
    ? schema.ruleActionExecutedEventTypeEnabledOverrides
    : Object.create(null);
  const ruleExecuteActionsOverrides = (schema && schema.ruleExecuteActionsOverrides && typeof schema.ruleExecuteActionsOverrides === "object")
    ? schema.ruleExecuteActionsOverrides
    : Object.create(null);
  const ruleActionTypeEnabledOverrides = (schema && schema.ruleActionTypeEnabledOverrides && typeof schema.ruleActionTypeEnabledOverrides === "object")
    ? schema.ruleActionTypeEnabledOverrides
    : Object.create(null);
  const unsub = [];
  const lastSourceEventAtById = new Map();
  const lastSeenAtBySignalId = new Map();
  const lastMatchAtByRuleId = new Map();

  function resolveEventArgs(eventId, overrides = null) {
    const base = runtime.eventById[String(eventId || "").trim().toLowerCase()];
    const defaultArgs = (base && typeof base.defaultArgs === "object" && base.defaultArgs)
      ? base.defaultArgs
      : {};
    const patch = (overrides && typeof overrides === "object") ? overrides : {};
    return { ...defaultArgs, ...patch };
  }

  function resolveWindowArgs(windowId, overrides = null) {
    const base = runtime.windowById[String(windowId || "").trim().toLowerCase()];
    const defaultArgs = (base && typeof base.defaultArgs === "object" && base.defaultArgs)
      ? base.defaultArgs
      : {};
    const patch = (overrides && typeof overrides === "object") ? overrides : {};
    return { ...defaultArgs, ...patch };
  }

  function executeRuleActions(rule, triggerMeta = {}, maxActionsBudget = 0) {
    if (!executeActions || !executionAllowsActions) return 0;
    const sourceEvent = String(triggerMeta && triggerMeta.sourceEvent || "");
    const signalId = String(triggerMeta && triggerMeta.signalId || "");
    const ruleId = String(rule && rule.id || "");
    const hasSourceEventEmitActionExecutedOverride = Object.prototype.hasOwnProperty.call(sourceEventEmitActionExecutedOverrides, sourceEvent);
    const sourceEventEmitActionExecuted = hasSourceEventEmitActionExecutedOverride
      ? !!sourceEventEmitActionExecutedOverrides[sourceEvent]
      : emitActionExecutedEvents;
    const hasSignalEmitActionExecutedOverride = Object.prototype.hasOwnProperty.call(signalEmitActionExecutedOverrides, signalId);
    const signalEmitActionExecuted = hasSignalEmitActionExecutedOverride
      ? !!signalEmitActionExecutedOverrides[signalId]
      : sourceEventEmitActionExecuted;
    const hasRuleEmitActionExecutedOverride = Object.prototype.hasOwnProperty.call(ruleEmitActionExecutedOverrides, ruleId);
    const effectiveEmitActionExecutedEvents = hasRuleEmitActionExecutedOverride
      ? !!ruleEmitActionExecutedOverrides[ruleId]
      : signalEmitActionExecuted;
    const sourceEventTelemetryTypeGate = (sourceEvent && sourceEventActionExecutedEventTypeEnabledOverrides[sourceEvent] && typeof sourceEventActionExecutedEventTypeEnabledOverrides[sourceEvent] === "object")
      ? sourceEventActionExecutedEventTypeEnabledOverrides[sourceEvent]
      : null;
    const signalTelemetryTypeGate = (signalId && signalActionExecutedEventTypeEnabledOverrides[signalId] && typeof signalActionExecutedEventTypeEnabledOverrides[signalId] === "object")
      ? signalActionExecutedEventTypeEnabledOverrides[signalId]
      : null;
    const ruleTelemetryTypeGate = (ruleId && ruleActionExecutedEventTypeEnabledOverrides[ruleId] && typeof ruleActionExecutedEventTypeEnabledOverrides[ruleId] === "object")
      ? ruleActionExecutedEventTypeEnabledOverrides[ruleId]
      : null;
    let effectiveExecuteActions = true;
    if (sourceEvent && Object.prototype.hasOwnProperty.call(sourceEventExecuteActionsOverrides, sourceEvent)) {
      effectiveExecuteActions = !!sourceEventExecuteActionsOverrides[sourceEvent];
    }
    if (signalId && Object.prototype.hasOwnProperty.call(signalExecuteActionsOverrides, signalId)) {
      effectiveExecuteActions = !!signalExecuteActionsOverrides[signalId];
    }
    if (ruleId && Object.prototype.hasOwnProperty.call(ruleExecuteActionsOverrides, ruleId)) {
      effectiveExecuteActions = !!ruleExecuteActionsOverrides[ruleId];
    }
    if (!effectiveExecuteActions) return 0;
    const actions = Array.isArray(rule && rule.actions) ? rule.actions : [];
    const sourceEventActionLimitRaw = Number(sourceEventMaxActionsPerRuleMatchOverrides[sourceEvent]);
    const sourceEventActionLimit = Number.isFinite(sourceEventActionLimitRaw)
      ? Math.max(0, Math.floor(sourceEventActionLimitRaw))
      : maxActionsPerRuleMatch;
    const signalActionLimitRaw = Number(signalMaxActionsPerRuleMatchOverrides[signalId]);
    const signalActionLimit = Number.isFinite(signalActionLimitRaw)
      ? Math.max(0, Math.floor(signalActionLimitRaw))
      : sourceEventActionLimit;
    const ruleActionLimitOverrideRaw = Number(ruleActionLimitOverrides[ruleId]);
    const baseMaxActionsPerRuleMatch = Number.isFinite(ruleActionLimitOverrideRaw)
      ? Math.max(0, Math.floor(ruleActionLimitOverrideRaw))
      : signalActionLimit;
    const budgetCap = Number.isFinite(Number(maxActionsBudget))
      ? Math.max(0, Math.floor(Number(maxActionsBudget)))
      : 0;
    const effectiveMaxActionsPerRuleMatch = (budgetCap > 0 && baseMaxActionsPerRuleMatch > 0)
      ? Math.min(baseMaxActionsPerRuleMatch, budgetCap)
      : (budgetCap > 0 ? budgetCap : baseMaxActionsPerRuleMatch);
    let executedActionCount = 0;
    for (let i = 0; i < actions.length; i += 1) {
      if (effectiveMaxActionsPerRuleMatch > 0 && executedActionCount >= effectiveMaxActionsPerRuleMatch) break;
      const action = actions[i];
      const type = String(action && action.type || "").trim().toLowerCase();
      const id = String(action && action.id || "").trim().toLowerCase();
      const ruleTypeGate = (ruleId && ruleActionTypeEnabledOverrides[ruleId] && typeof ruleActionTypeEnabledOverrides[ruleId] === "object")
        ? ruleActionTypeEnabledOverrides[ruleId]
        : null;
      const hasRuleTypeGate = !!(ruleTypeGate && Object.prototype.hasOwnProperty.call(ruleTypeGate, type));
      const sourceEventTypeGate = (sourceEvent && sourceEventActionTypeEnabledOverrides[sourceEvent] && typeof sourceEventActionTypeEnabledOverrides[sourceEvent] === "object")
        ? sourceEventActionTypeEnabledOverrides[sourceEvent]
        : null;
      const hasSourceEventTypeGate = !!(sourceEventTypeGate && Object.prototype.hasOwnProperty.call(sourceEventTypeGate, type));
      const signalTypeGate = (signalId && signalActionTypeEnabledOverrides[signalId] && typeof signalActionTypeEnabledOverrides[signalId] === "object")
        ? signalActionTypeEnabledOverrides[signalId]
        : null;
      const hasSignalTypeGate = !!(signalTypeGate && Object.prototype.hasOwnProperty.call(signalTypeGate, type));
      const typeEnabled = hasRuleTypeGate
        ? !!ruleTypeGate[type]
        : (
          hasSignalTypeGate
            ? !!signalTypeGate[type]
            : (
              hasSourceEventTypeGate
                ? !!sourceEventTypeGate[type]
                : (
                  Object.prototype.hasOwnProperty.call(actionTypeEnabled, type)
                    ? !!actionTypeEnabled[type]
                    : true
                )
            )
        );
      if (!typeEnabled) {
        continue;
      }
      const argOverride = resolveActionArgOverride(ruleId, action, i, actionArgOverrides);
      const mergedOverrides = (argOverride && typeof argOverride === "object")
        ? { ...(action && action.overrides || {}), ...argOverride }
        : (action && action.overrides);
      if (type === "wake_win") {
        const windowDef = runtime.windowById[id];
        if (windowDef && windowDef.enabled === false) continue;
        const args = resolveWindowArgs(id, mergedOverrides);
        eventBus.emit(EVT_RULE_ENGINE_WAKE_WIN_OPENED, {
          ruleId: String(rule && rule.id || ""),
          actionId: id,
          spells: Array.isArray(action && action.spells) ? action.spells.slice() : [],
          ttlMs: Number(args && args.ttlMs) || 0,
          atMs: Number(triggerMeta.atMs) || nowMs(),
        });
        const emitTypeEnabled = ruleTelemetryTypeGate && Object.prototype.hasOwnProperty.call(ruleTelemetryTypeGate, "wake_win")
          ? !!ruleTelemetryTypeGate.wake_win
          : (signalTelemetryTypeGate && Object.prototype.hasOwnProperty.call(signalTelemetryTypeGate, "wake_win")
          ? !!signalTelemetryTypeGate.wake_win
          : (sourceEventTelemetryTypeGate && Object.prototype.hasOwnProperty.call(sourceEventTelemetryTypeGate, "wake_win")
          ? !!sourceEventTelemetryTypeGate.wake_win
          : (
            Object.prototype.hasOwnProperty.call(actionExecutedEventTypeEnabled, "wake_win")
              ? !!actionExecutedEventTypeEnabled.wake_win
              : true
          )));
        if (effectiveEmitActionExecutedEvents && emitTypeEnabled) {
          emitRuleEngineEventCompat(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED, EVT_RULE_ENGINE_V1_ACTION_EXECUTED, {
            ruleId: String(rule && rule.id || ""),
            actionType: "wake_win",
            actionId: id,
            args,
            spells: Array.isArray(action && action.spells) ? action.spells.slice() : [],
            atMs: Number(triggerMeta.atMs) || nowMs(),
          });
        }
        executedActionCount += 1;
        continue;
      }
      if (type !== "event") continue;
      const eventDef = runtime.eventById[id];
      if (eventDef && eventDef.enabled === false) continue;
      const args = resolveEventArgs(id, mergedOverrides);
      const emitTypeEnabled = ruleTelemetryTypeGate && Object.prototype.hasOwnProperty.call(ruleTelemetryTypeGate, "event")
        ? !!ruleTelemetryTypeGate.event
        : (signalTelemetryTypeGate && Object.prototype.hasOwnProperty.call(signalTelemetryTypeGate, "event")
        ? !!signalTelemetryTypeGate.event
        : (sourceEventTelemetryTypeGate && Object.prototype.hasOwnProperty.call(sourceEventTelemetryTypeGate, "event")
        ? !!sourceEventTelemetryTypeGate.event
        : (
          Object.prototype.hasOwnProperty.call(actionExecutedEventTypeEnabled, "event")
            ? !!actionExecutedEventTypeEnabled.event
            : true
        )));
      if (effectiveEmitActionExecutedEvents && emitTypeEnabled) {
        emitRuleEngineEventCompat(eventBus, EVT_RULE_ENGINE_ACTION_EXECUTED, EVT_RULE_ENGINE_V1_ACTION_EXECUTED, {
          ruleId: String(rule && rule.id || ""),
          actionType: "event",
          actionId: id,
          args,
          atMs: Number(triggerMeta.atMs) || nowMs(),
        });
      }
      executedActionCount += 1;
    }
    return executedActionCount;
  }

  function onSignalHit(signalId, sourceEvent, payload = {}, maxMatchesBudget = 0, maxActionsBudget = 0, maxRulesEvaluatedBudget = 0) {
    const now = Number(payload && payload.atMs) || nowMs();
    const overrideDebounceMsRaw = Number(signalDebounceOverrides[signalId]);
    const effectiveSignalDebounceMs = Number.isFinite(overrideDebounceMsRaw)
      ? Math.max(0, overrideDebounceMsRaw)
      : signalDebounceMs;
    const previousSeenAt = Number(lastSeenAtBySignalId.get(signalId) || 0);
    if (effectiveSignalDebounceMs > 0 && previousSeenAt > 0 && (now - previousSeenAt) < effectiveSignalDebounceMs) {
      return;
    }
    lastSeenAtBySignalId.set(signalId, now);
    const candidates = runtime.rulesBySignalId[signalId] || [];
    const sourceEventMaxMatchesOverrideRaw = Number(sourceEventMaxMatchesPerSignalOverrides[String(sourceEvent || "")]);
    const sourceEventMaxMatchesPerSignal = Number.isFinite(sourceEventMaxMatchesOverrideRaw)
      ? Math.max(0, Math.floor(sourceEventMaxMatchesOverrideRaw))
      : maxMatchesPerSignal;
    const signalMaxMatchesOverrideRaw = Number(signalMaxMatchesOverrides[signalId]);
    const baseMaxMatchesPerSignal = Number.isFinite(signalMaxMatchesOverrideRaw)
      ? Math.max(0, Math.floor(signalMaxMatchesOverrideRaw))
      : sourceEventMaxMatchesPerSignal;
    const budgetCap = Number.isFinite(Number(maxMatchesBudget))
      ? Math.max(0, Math.floor(Number(maxMatchesBudget)))
      : 0;
    const effectiveMaxMatchesPerSignal = (budgetCap > 0 && baseMaxMatchesPerSignal > 0)
      ? Math.min(baseMaxMatchesPerSignal, budgetCap)
      : (budgetCap > 0 ? budgetCap : baseMaxMatchesPerSignal);
    const signalMaxActionsPerSignalOverrideRaw = Number(signalMaxActionsPerSignalOverrides[String(signalId || "")]);
    const sourceEventMaxActionsPerSignalOverrideRaw = Number(sourceEventMaxActionsPerSignalOverrides[String(sourceEvent || "")]);
    const sourceEventMaxActionsPerSignal = Number.isFinite(sourceEventMaxActionsPerSignalOverrideRaw)
      ? Math.max(0, Math.floor(sourceEventMaxActionsPerSignalOverrideRaw))
      : maxActionsPerSignal;
    const effectiveMaxActionsPerSignal = Number.isFinite(signalMaxActionsPerSignalOverrideRaw)
      ? Math.max(0, Math.floor(signalMaxActionsPerSignalOverrideRaw))
      : sourceEventMaxActionsPerSignal;
    const sourceEventMaxRulesEvaluatedOverrideRaw = Number(sourceEventMaxRulesEvaluatedOverrides[String(sourceEvent || "")]);
    const sourceEventMaxRulesEvaluatedPerSignal = Number.isFinite(sourceEventMaxRulesEvaluatedOverrideRaw)
      ? Math.max(0, Math.floor(sourceEventMaxRulesEvaluatedOverrideRaw))
      : maxRulesEvaluatedPerSignal;
    const signalMaxRulesEvaluatedOverrideRaw = Number(signalMaxRulesEvaluatedOverrides[signalId]);
    const baseMaxRulesEvaluatedPerSignal = Number.isFinite(signalMaxRulesEvaluatedOverrideRaw)
      ? Math.max(0, Math.floor(signalMaxRulesEvaluatedOverrideRaw))
      : sourceEventMaxRulesEvaluatedPerSignal;
    const rulesBudgetCap = Number.isFinite(Number(maxRulesEvaluatedBudget))
      ? Math.max(0, Math.floor(Number(maxRulesEvaluatedBudget)))
      : 0;
    const effectiveMaxRulesEvaluatedPerSignal = (rulesBudgetCap > 0 && baseMaxRulesEvaluatedPerSignal > 0)
      ? Math.min(baseMaxRulesEvaluatedPerSignal, rulesBudgetCap)
      : (rulesBudgetCap > 0 ? rulesBudgetCap : baseMaxRulesEvaluatedPerSignal);
    const hasSourceEventStopOnFirstMatchOverride = Object.prototype.hasOwnProperty.call(
      sourceEventStopOnFirstMatchOverrides,
      String(sourceEvent || "")
    );
    const sourceEventStopOnFirstMatch = hasSourceEventStopOnFirstMatchOverride
      ? !!sourceEventStopOnFirstMatchOverrides[String(sourceEvent || "")]
      : stopOnFirstMatch;
    const hasSignalStopOnFirstMatchOverride = Object.prototype.hasOwnProperty.call(
      signalStopOnFirstMatchOverrides,
      String(signalId || "")
    );
    const effectiveStopOnFirstMatch = hasSignalStopOnFirstMatchOverride
      ? !!signalStopOnFirstMatchOverrides[String(signalId || "")]
      : sourceEventStopOnFirstMatch;
    const hasSourceEventEmitOverride = Object.prototype.hasOwnProperty.call(sourceEventEmitPreviewMatchedOverrides, String(sourceEvent || ""));
    const sourceEventEmitPreviewMatched = hasSourceEventEmitOverride
      ? !!sourceEventEmitPreviewMatchedOverrides[String(sourceEvent || "")]
      : emitPreviewMatchedEvents;
    const hasSignalEmitOverride = Object.prototype.hasOwnProperty.call(
      signalEmitPreviewMatchedOverrides,
      String(signalId || "")
    );
    const effectiveEmitPreviewMatchedEvents = hasSignalEmitOverride
      ? !!signalEmitPreviewMatchedOverrides[String(signalId || "")]
      : sourceEventEmitPreviewMatched;
    let matchedCount = 0;
    let actionCount = 0;
    let evaluatedCount = 0;
    let firstMatchedRuleId = "";
    for (const rule of candidates) {
      evaluatedCount += 1;
      if (effectiveMaxRulesEvaluatedPerSignal > 0 && evaluatedCount > effectiveMaxRulesEvaluatedPerSignal) break;
      const ruleId = String(rule && rule.id || "");
      const sourceEventMatchWindowScaleRaw = Number(sourceEventMatchWindowScaleOverrides[String(sourceEvent || "")]);
      const sourceEventMatchWindowScale = Number.isFinite(sourceEventMatchWindowScaleRaw)
        ? Math.max(0, sourceEventMatchWindowScaleRaw)
        : matchWindowScale;
      const signalMatchWindowScaleRaw = Number(signalMatchWindowScaleOverrides[String(signalId || "")]);
      const signalMatchWindowScale = Number.isFinite(signalMatchWindowScaleRaw)
        ? Math.max(0, signalMatchWindowScaleRaw)
        : sourceEventMatchWindowScale;
      const ruleMatchWindowScaleRaw = Number(ruleMatchWindowScaleOverrides[ruleId]);
      const effectiveMatchWindowScale = Number.isFinite(ruleMatchWindowScaleRaw)
        ? Math.max(0, ruleMatchWindowScaleRaw)
        : signalMatchWindowScale;
      if (!ruleMatches(rule, lastSeenAtBySignalId, now, effectiveMatchWindowScale)) continue;
      if (!firstMatchedRuleId) firstMatchedRuleId = String(ruleId || "");
      const sourceEventCooldownScaleRaw = Number(sourceEventCooldownScaleOverrides[String(sourceEvent || "")]);
      const sourceEventCooldownScale = Number.isFinite(sourceEventCooldownScaleRaw)
        ? Math.max(0, sourceEventCooldownScaleRaw)
        : cooldownScale;
      const signalCooldownScaleRaw = Number(signalCooldownScaleOverrides[String(signalId || "")]);
      const signalCooldownScale = Number.isFinite(signalCooldownScaleRaw)
        ? Math.max(0, signalCooldownScaleRaw)
        : sourceEventCooldownScale;
      const ruleCooldownScaleRaw = Number(ruleCooldownScaleOverrides[ruleId]);
      const effectiveCooldownScale = Number.isFinite(ruleCooldownScaleRaw)
        ? Math.max(0, ruleCooldownScaleRaw)
        : signalCooldownScale;
      const cooldownMs = Math.max(0, Number(rule.cooldownMs) || 0) * effectiveCooldownScale;
      const lastMatchedAt = Number(lastMatchAtByRuleId.get(rule.id) || 0);
      if (cooldownMs > 0 && (now - lastMatchedAt) < cooldownMs) continue;
      lastMatchAtByRuleId.set(rule.id, now);
      const hasRuleEmitOverride = Object.prototype.hasOwnProperty.call(ruleEmitPreviewMatchedOverrides, ruleId);
      const effectiveRuleEmitPreviewMatched = hasRuleEmitOverride
        ? !!ruleEmitPreviewMatchedOverrides[ruleId]
        : effectiveEmitPreviewMatchedEvents;
      if (effectiveRuleEmitPreviewMatched) {
        emitRuleEngineEventCompat(eventBus, EVT_RULE_ENGINE_PREVIEW_MATCHED, EVT_RULE_ENGINE_V1_PREVIEW_MATCHED, {
          ruleId: rule.id,
          signalId,
          sourceEvent: String(sourceEvent || ""),
          atMs: now,
        });
      }
      const remainingActionBudget = (maxActionsBudget > 0)
        ? Math.max(0, maxActionsBudget - actionCount)
        : 0;
      const remainingActionBudgetFromSignal = (effectiveMaxActionsPerSignal > 0)
        ? Math.max(0, effectiveMaxActionsPerSignal - actionCount)
        : 0;
      const effectiveRemainingActionBudget = (remainingActionBudget > 0 && remainingActionBudgetFromSignal > 0)
        ? Math.min(remainingActionBudget, remainingActionBudgetFromSignal)
        : (remainingActionBudget > 0 ? remainingActionBudget : remainingActionBudgetFromSignal);
      actionCount += executeRuleActions(rule, {
        signalId,
        sourceEvent,
        atMs: now,
      }, effectiveRemainingActionBudget);
      matchedCount += 1;
      if (effectiveStopOnFirstMatch) break;
      if (effectiveMaxMatchesPerSignal > 0 && matchedCount >= effectiveMaxMatchesPerSignal) break;
      if (effectiveMaxActionsPerSignal > 0 && actionCount >= effectiveMaxActionsPerSignal) break;
      if (maxActionsBudget > 0 && actionCount >= maxActionsBudget) break;
    }
    return {
      matchedCount,
      actionCount,
      evaluatedCount,
      firstMatchedRuleId,
    };
  }

  function start() {
    for (const sourceEvent of Object.keys(runtime.signalsBySourceEvent)) {
      if (Object.prototype.hasOwnProperty.call(sourceEventEnabledOverrides, sourceEvent)) {
        if (sourceEventEnabledOverrides[sourceEvent] === false) continue;
      }
      const signals = runtime.signalsBySourceEvent[sourceEvent] || [];
      if (!signals.length) continue;
      unsub.push(eventBus.on(sourceEvent, (payload = {}) => {
        const now = Number(payload && payload.atMs) || nowMs();
        const sourceEventDebounceOverrideRaw = Number(sourceEventDebounceOverrides[sourceEvent]);
        const effectiveSourceEventDebounceMs = Number.isFinite(sourceEventDebounceOverrideRaw)
          ? Math.max(0, sourceEventDebounceOverrideRaw)
          : sourceEventDebounceMs;
        const sourceEventMaxSignalsOverrideRaw = Number(sourceEventMaxSignalsOverrides[sourceEvent]);
        const effectiveMaxSignalsPerEvent = Number.isFinite(sourceEventMaxSignalsOverrideRaw)
          ? Math.max(0, Math.floor(sourceEventMaxSignalsOverrideRaw))
          : maxSignalsPerEvent;
        const sourceEventMaxSignalsEvaluatedPerEventOverrideRaw = Number(sourceEventMaxSignalsEvaluatedPerEventOverrides[sourceEvent]);
        const effectiveMaxSignalsEvaluatedPerEvent = Number.isFinite(sourceEventMaxSignalsEvaluatedPerEventOverrideRaw)
          ? Math.max(0, Math.floor(sourceEventMaxSignalsEvaluatedPerEventOverrideRaw))
          : maxSignalsEvaluatedPerEvent;
        const sourceEventMaxMatchesPerEventOverrideRaw = Number(sourceEventMaxMatchesPerEventOverrides[sourceEvent]);
        const effectiveMaxMatchesPerEvent = Number.isFinite(sourceEventMaxMatchesPerEventOverrideRaw)
          ? Math.max(0, Math.floor(sourceEventMaxMatchesPerEventOverrideRaw))
          : maxMatchesPerEvent;
        const sourceEventMaxRulesEvaluatedPerEventOverrideRaw = Number(sourceEventMaxRulesEvaluatedPerEventOverrides[sourceEvent]);
        const effectiveMaxRulesEvaluatedPerEvent = Number.isFinite(sourceEventMaxRulesEvaluatedPerEventOverrideRaw)
          ? Math.max(0, Math.floor(sourceEventMaxRulesEvaluatedPerEventOverrideRaw))
          : maxRulesEvaluatedPerEvent;
        const sourceEventMaxActionsPerEventOverrideRaw = Number(sourceEventMaxActionsPerEventOverrides[sourceEvent]);
        const effectiveMaxActionsPerEvent = Number.isFinite(sourceEventMaxActionsPerEventOverrideRaw)
          ? Math.max(0, Math.floor(sourceEventMaxActionsPerEventOverrideRaw))
          : maxActionsPerEvent;
        const hasSourceEventFirstMatchOverride = Object.prototype.hasOwnProperty.call(sourceEventStopOnFirstSignalMatchOverrides, sourceEvent);
        const effectiveStopOnFirstSignalMatchPerEvent = hasSourceEventFirstMatchOverride
          ? !!sourceEventStopOnFirstSignalMatchOverrides[sourceEvent]
          : stopOnFirstSignalMatchPerEvent;
        const lastAt = Number(lastSourceEventAtById.get(sourceEvent) || 0);
        if (effectiveSourceEventDebounceMs > 0 && lastAt > 0 && (now - lastAt) < effectiveSourceEventDebounceMs) {
          return;
        }
        lastSourceEventAtById.set(sourceEvent, now);
        let matchedSignalCount = 0;
        let summarySignalId = "";
        let summaryRuleId = "";
        let evaluatedSignalCount = 0;
        let matchedRuleCount = 0;
        let actionCount = 0;
        let evaluatedRuleCount = 0;
        for (const signal of signals) {
          const signalEvaluatedSignalsEventCapRaw = Number(signalMaxSignalsEvaluatedPerEventOverrides[String(signal.id || "")]);
          const signalEvaluatedSignalsEventCap = Number.isFinite(signalEvaluatedSignalsEventCapRaw)
            ? Math.max(0, Math.floor(signalEvaluatedSignalsEventCapRaw))
            : 0;
          const effectiveMaxSignalsEvaluatedPerEventForCurrentSignal = (signalEvaluatedSignalsEventCap > 0 && effectiveMaxSignalsEvaluatedPerEvent > 0)
            ? Math.min(signalEvaluatedSignalsEventCap, effectiveMaxSignalsEvaluatedPerEvent)
            : (signalEvaluatedSignalsEventCap > 0 ? signalEvaluatedSignalsEventCap : effectiveMaxSignalsEvaluatedPerEvent);
          evaluatedSignalCount += 1;
          if (effectiveMaxSignalsEvaluatedPerEventForCurrentSignal > 0 && evaluatedSignalCount > effectiveMaxSignalsEvaluatedPerEventForCurrentSignal) break;
          const shouldStopAfterCurrentSignalEvaluation = (
            effectiveMaxSignalsEvaluatedPerEventForCurrentSignal > 0
            && evaluatedSignalCount >= effectiveMaxSignalsEvaluatedPerEventForCurrentSignal
          );
          if (!signalMatchesPayload(signal, payload)) {
            if (shouldStopAfterCurrentSignalEvaluation) break;
            continue;
          }
          if (!summarySignalId) summarySignalId = String(signal.id || "");
          const remainingMatchedSignalBudget = (effectiveMaxSignalsPerEvent > 0)
            ? Math.max(0, effectiveMaxSignalsPerEvent - matchedSignalCount)
            : 0;
          const signalMatchedSignalsEventCapRaw = Number(signalMaxSignalsPerEventOverrides[String(signal.id || "")]);
          const signalMatchedSignalsEventCap = Number.isFinite(signalMatchedSignalsEventCapRaw)
            ? Math.max(0, Math.floor(signalMatchedSignalsEventCapRaw))
            : 0;
          const effectiveRemainingMatchedSignalBudget = (signalMatchedSignalsEventCap > 0 && remainingMatchedSignalBudget > 0)
            ? Math.min(signalMatchedSignalsEventCap, remainingMatchedSignalBudget)
            : (signalMatchedSignalsEventCap > 0 ? signalMatchedSignalsEventCap : remainingMatchedSignalBudget);
          if (effectiveRemainingMatchedSignalBudget === 0 && (signalMatchedSignalsEventCap > 0 || remainingMatchedSignalBudget > 0)) {
            break;
          }
          const remainingMatchBudget = (effectiveMaxMatchesPerEvent > 0)
            ? Math.max(0, effectiveMaxMatchesPerEvent - matchedRuleCount)
            : 0;
          const signalEventMatchCapRaw = Number(signalMaxMatchesPerEventOverrides[String(signal.id || "")]);
          const signalEventMatchCap = Number.isFinite(signalEventMatchCapRaw)
            ? Math.max(0, Math.floor(signalEventMatchCapRaw))
            : 0;
          const effectiveRemainingMatchBudget = (signalEventMatchCap > 0 && remainingMatchBudget > 0)
            ? Math.min(signalEventMatchCap, remainingMatchBudget)
            : (signalEventMatchCap > 0 ? signalEventMatchCap : remainingMatchBudget);
          const signalEventActionCapRaw = Number(signalMaxActionsPerEventOverrides[String(signal.id || "")]);
          const signalEventActionCap = Number.isFinite(signalEventActionCapRaw)
            ? Math.max(0, Math.floor(signalEventActionCapRaw))
            : 0;
          const remainingActionBudgetFromEvent = (effectiveMaxActionsPerEvent > 0)
            ? Math.max(0, effectiveMaxActionsPerEvent - actionCount)
            : 0;
          const remainingActionBudget = (signalEventActionCap > 0 && remainingActionBudgetFromEvent > 0)
            ? Math.min(signalEventActionCap, remainingActionBudgetFromEvent)
            : (signalEventActionCap > 0 ? signalEventActionCap : remainingActionBudgetFromEvent);
          const remainingRulesEvaluatedBudget = (effectiveMaxRulesEvaluatedPerEvent > 0)
            ? Math.max(0, effectiveMaxRulesEvaluatedPerEvent - evaluatedRuleCount)
            : 0;
          const signalRulesEvaluatedEventCapRaw = Number(signalMaxRulesEvaluatedPerEventOverrides[String(signal.id || "")]);
          const signalRulesEvaluatedEventCap = Number.isFinite(signalRulesEvaluatedEventCapRaw)
            ? Math.max(0, Math.floor(signalRulesEvaluatedEventCapRaw))
            : 0;
          const effectiveRemainingRulesEvaluatedBudget = (signalRulesEvaluatedEventCap > 0 && remainingRulesEvaluatedBudget > 0)
            ? Math.min(signalRulesEvaluatedEventCap, remainingRulesEvaluatedBudget)
            : (signalRulesEvaluatedEventCap > 0 ? signalRulesEvaluatedEventCap : remainingRulesEvaluatedBudget);
          const hit = onSignalHit(
            signal.id,
            sourceEvent,
            payload,
            effectiveRemainingMatchBudget,
            remainingActionBudget,
            effectiveRemainingRulesEvaluatedBudget
          );
          matchedRuleCount += Number(hit && hit.matchedCount || 0);
          actionCount += Number(hit && hit.actionCount || 0);
          evaluatedRuleCount += Number(hit && hit.evaluatedCount || 0);
          if (!summaryRuleId && hit && hit.firstMatchedRuleId) {
            summaryRuleId = String(hit.firstMatchedRuleId || "");
          }
          matchedSignalCount += 1;
          const effectiveMaxSignalsPerEventForCurrentSignal = (signalMatchedSignalsEventCap > 0 && effectiveMaxSignalsPerEvent > 0)
            ? Math.min(signalMatchedSignalsEventCap, effectiveMaxSignalsPerEvent)
            : (signalMatchedSignalsEventCap > 0 ? signalMatchedSignalsEventCap : effectiveMaxSignalsPerEvent);
          const hasSignalFirstSignalMatchOverride = Object.prototype.hasOwnProperty.call(
            signalStopOnFirstSignalMatchPerEventOverrides,
            String(signal.id || "")
          );
          const effectiveStopOnFirstSignalForCurrentSignal = hasSignalFirstSignalMatchOverride
            ? !!signalStopOnFirstSignalMatchPerEventOverrides[String(signal.id || "")]
            : effectiveStopOnFirstSignalMatchPerEvent;
          if (effectiveMaxMatchesPerEvent > 0 && matchedRuleCount >= effectiveMaxMatchesPerEvent) break;
          if (effectiveMaxActionsPerEvent > 0 && actionCount >= effectiveMaxActionsPerEvent) break;
          if (effectiveMaxRulesEvaluatedPerEvent > 0 && evaluatedRuleCount >= effectiveMaxRulesEvaluatedPerEvent) break;
          if (shouldStopAfterCurrentSignalEvaluation) break;
          if (effectiveStopOnFirstSignalForCurrentSignal) break;
          if (effectiveMaxSignalsPerEventForCurrentSignal > 0 && matchedSignalCount >= effectiveMaxSignalsPerEventForCurrentSignal) break;
        }
        const hasSourceEventSummaryEmitOverride = Object.prototype.hasOwnProperty.call(sourceEventEmitSourceEventSummaryOverrides, sourceEvent);
        const sourceEventSummaryEmit = hasSourceEventSummaryEmitOverride
          ? !!sourceEventEmitSourceEventSummaryOverrides[sourceEvent]
          : emitSourceEventSummaryEvents;
        const hasSignalSummaryEmitOverride = Object.prototype.hasOwnProperty.call(signalEmitSourceEventSummaryOverrides, String(summarySignalId || ""));
        const signalSummaryEmit = hasSignalSummaryEmitOverride
          ? !!signalEmitSourceEventSummaryOverrides[String(summarySignalId || "")]
          : sourceEventSummaryEmit;
        const hasRuleSummaryEmitOverride = Object.prototype.hasOwnProperty.call(ruleEmitSourceEventSummaryOverrides, String(summaryRuleId || ""));
        const effectiveEmitSourceEventSummaryEvents = hasRuleSummaryEmitOverride
          ? !!ruleEmitSourceEventSummaryOverrides[String(summaryRuleId || "")]
          : signalSummaryEmit;
        if (effectiveEmitSourceEventSummaryEvents) {
          const summaryPayload = {
            sourceEvent,
            atMs: now,
            evaluatedSignalCount,
            matchedSignalCount,
            evaluatedRuleCount,
            matchedRuleCount,
            actionCount,
          };
          const hasSourceEventSummaryIncludeIdsOverride = Object.prototype.hasOwnProperty.call(
            sourceEventSummaryIncludeSignalAndRuleIdsOverrides,
            sourceEvent
          );
          const effectiveSourceEventSummaryIncludeIds = hasSourceEventSummaryIncludeIdsOverride
            ? !!sourceEventSummaryIncludeSignalAndRuleIdsOverrides[sourceEvent]
            : sourceEventSummaryIncludeSignalAndRuleIds;
          const hasSignalSummaryIncludeIdsOverride = Object.prototype.hasOwnProperty.call(
            signalSummaryIncludeSignalAndRuleIdsOverrides,
            String(summarySignalId || "")
          );
          const signalSummaryIncludeIds = hasSignalSummaryIncludeIdsOverride
            ? !!signalSummaryIncludeSignalAndRuleIdsOverrides[String(summarySignalId || "")]
            : effectiveSourceEventSummaryIncludeIds;
          const hasRuleSummaryIncludeIdsOverride = Object.prototype.hasOwnProperty.call(
            ruleSummaryIncludeSignalAndRuleIdsOverrides,
            String(summaryRuleId || "")
          );
          const effectiveSummaryIncludeIds = hasRuleSummaryIncludeIdsOverride
            ? !!ruleSummaryIncludeSignalAndRuleIdsOverrides[String(summaryRuleId || "")]
            : signalSummaryIncludeIds;
          if (effectiveSummaryIncludeIds) {
            summaryPayload.signalId = String(summarySignalId || "");
            summaryPayload.ruleId = String(summaryRuleId || "");
          }
          const hasSourceEventSummaryIncludeBudgetCapsOverride = Object.prototype.hasOwnProperty.call(
            sourceEventSummaryIncludeBudgetCapsOverrides,
            sourceEvent
          );
          const effectiveSourceEventSummaryIncludeBudgetCaps = hasSourceEventSummaryIncludeBudgetCapsOverride
            ? !!sourceEventSummaryIncludeBudgetCapsOverrides[sourceEvent]
            : sourceEventSummaryIncludeBudgetCaps;
          const hasSignalSummaryIncludeBudgetCapsOverride = Object.prototype.hasOwnProperty.call(
            signalSummaryIncludeBudgetCapsOverrides,
            String(summarySignalId || "")
          );
          const effectiveSummaryIncludeBudgetCaps = hasSignalSummaryIncludeBudgetCapsOverride
            ? !!signalSummaryIncludeBudgetCapsOverrides[String(summarySignalId || "")]
            : effectiveSourceEventSummaryIncludeBudgetCaps;
          const hasRuleSummaryIncludeBudgetCapsOverride = Object.prototype.hasOwnProperty.call(
            ruleSummaryIncludeBudgetCapsOverrides,
            String(summaryRuleId || "")
          );
          const effectiveRuleSummaryIncludeBudgetCaps = hasRuleSummaryIncludeBudgetCapsOverride
            ? !!ruleSummaryIncludeBudgetCapsOverrides[String(summaryRuleId || "")]
            : effectiveSummaryIncludeBudgetCaps;
          if (effectiveRuleSummaryIncludeBudgetCaps) {
            summaryPayload.maxSignalsEvaluatedPerEvent = effectiveMaxSignalsEvaluatedPerEvent;
            summaryPayload.maxSignalsPerEvent = effectiveMaxSignalsPerEvent;
            summaryPayload.maxRulesEvaluatedPerEvent = effectiveMaxRulesEvaluatedPerEvent;
            summaryPayload.maxMatchesPerEvent = effectiveMaxMatchesPerEvent;
            summaryPayload.maxActionsPerEvent = effectiveMaxActionsPerEvent;
          }
          emitRuleEngineEventCompat(
            eventBus,
            EVT_RULE_ENGINE_SOURCE_EVENT_SUMMARY,
            EVT_RULE_ENGINE_V1_SOURCE_EVENT_SUMMARY,
            summaryPayload
          );
        }
      }));
    }
  }

  function stop() {
    while (unsub.length) {
      const off = unsub.pop();
      try { off(); } catch (_) {}
    }
  }

  function snapshot() {
    return {
      runtime,
      seenSignalIds: Array.from(lastSeenAtBySignalId.keys()),
    };
  }

  return {
    start,
    stop,
    snapshot,
  };
}
