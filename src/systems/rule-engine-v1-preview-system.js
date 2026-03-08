import { buildRuleEngineV1PreviewRuntime } from "../content/spell-rules/index.js";

const EVT_RULE_ENGINE_V1_PREVIEW_MATCHED = "rule_engine.v1.preview_matched";
const EVT_RULE_ENGINE_V1_ACTION_EXECUTED = "rule_engine.v1.action_executed";

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
  const maxSignalsPerEventRaw = Number(execution.maxSignalsPerEvent);
  const maxSignalsPerEvent = Number.isFinite(maxSignalsPerEventRaw)
    ? Math.max(0, Math.floor(maxSignalsPerEventRaw))
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
  const executionAllowsActions = (Object.prototype.hasOwnProperty.call(execution, "executeActions"))
    ? !!execution.executeActions
    : true;
  const actionTypeEnabled = (execution && execution.actionTypeEnabled && typeof execution.actionTypeEnabled === "object")
    ? execution.actionTypeEnabled
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
  const signalActionTypeEnabledOverrides = (schema && schema.signalActionTypeEnabledOverrides && typeof schema.signalActionTypeEnabledOverrides === "object")
    ? schema.signalActionTypeEnabledOverrides
    : Object.create(null);
  const signalMatchWindowScaleOverrides = (schema && schema.signalMatchWindowScaleOverrides && typeof schema.signalMatchWindowScaleOverrides === "object")
    ? schema.signalMatchWindowScaleOverrides
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
  const sourceEventStopOnFirstSignalMatchOverrides = (schema && schema.sourceEventStopOnFirstSignalMatchOverrides && typeof schema.sourceEventStopOnFirstSignalMatchOverrides === "object")
    ? schema.sourceEventStopOnFirstSignalMatchOverrides
    : Object.create(null);
  const sourceEventEmitPreviewMatchedOverrides = (schema && schema.sourceEventEmitPreviewMatchedOverrides && typeof schema.sourceEventEmitPreviewMatchedOverrides === "object")
    ? schema.sourceEventEmitPreviewMatchedOverrides
    : Object.create(null);
  const sourceEventActionTypeEnabledOverrides = (schema && schema.sourceEventActionTypeEnabledOverrides && typeof schema.sourceEventActionTypeEnabledOverrides === "object")
    ? schema.sourceEventActionTypeEnabledOverrides
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

  function executeRuleActions(rule, triggerMeta = {}) {
    if (!executeActions || !executionAllowsActions) return;
    const sourceEvent = String(triggerMeta && triggerMeta.sourceEvent || "");
    const signalId = String(triggerMeta && triggerMeta.signalId || "");
    const ruleId = String(rule && rule.id || "");
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
    if (!effectiveExecuteActions) return;
    const actions = Array.isArray(rule && rule.actions) ? rule.actions : [];
    const sourceEventActionLimitRaw = Number(sourceEventMaxActionsPerRuleMatchOverrides[sourceEvent]);
    const sourceEventActionLimit = Number.isFinite(sourceEventActionLimitRaw)
      ? Math.max(0, Math.floor(sourceEventActionLimitRaw))
      : maxActionsPerRuleMatch;
    const ruleActionLimitOverrideRaw = Number(ruleActionLimitOverrides[ruleId]);
    const effectiveMaxActionsPerRuleMatch = Number.isFinite(ruleActionLimitOverrideRaw)
      ? Math.max(0, Math.floor(ruleActionLimitOverrideRaw))
      : sourceEventActionLimit;
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
        eventBus.emit(EVT_RULE_ENGINE_V1_ACTION_EXECUTED, {
          ruleId: String(rule && rule.id || ""),
          actionType: "wake_win",
          actionId: id,
          args,
          spells: Array.isArray(action && action.spells) ? action.spells.slice() : [],
          atMs: Number(triggerMeta.atMs) || nowMs(),
        });
        executedActionCount += 1;
        continue;
      }
      if (type !== "event") continue;
      const eventDef = runtime.eventById[id];
      if (eventDef && eventDef.enabled === false) continue;
      const args = resolveEventArgs(id, mergedOverrides);
      eventBus.emit(EVT_RULE_ENGINE_V1_ACTION_EXECUTED, {
        ruleId: String(rule && rule.id || ""),
        actionType: "event",
        actionId: id,
        args,
        atMs: Number(triggerMeta.atMs) || nowMs(),
      });
      executedActionCount += 1;
    }
  }

  function onSignalHit(signalId, sourceEvent, payload = {}) {
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
    const effectiveMaxMatchesPerSignal = Number.isFinite(signalMaxMatchesOverrideRaw)
      ? Math.max(0, Math.floor(signalMaxMatchesOverrideRaw))
      : sourceEventMaxMatchesPerSignal;
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
    for (const rule of candidates) {
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
      const sourceEventCooldownScaleRaw = Number(sourceEventCooldownScaleOverrides[String(sourceEvent || "")]);
      const sourceEventCooldownScale = Number.isFinite(sourceEventCooldownScaleRaw)
        ? Math.max(0, sourceEventCooldownScaleRaw)
        : cooldownScale;
      const ruleCooldownScaleRaw = Number(ruleCooldownScaleOverrides[ruleId]);
      const effectiveCooldownScale = Number.isFinite(ruleCooldownScaleRaw)
        ? Math.max(0, ruleCooldownScaleRaw)
        : sourceEventCooldownScale;
      const cooldownMs = Math.max(0, Number(rule.cooldownMs) || 0) * effectiveCooldownScale;
      const lastMatchedAt = Number(lastMatchAtByRuleId.get(rule.id) || 0);
      if (cooldownMs > 0 && (now - lastMatchedAt) < cooldownMs) continue;
      lastMatchAtByRuleId.set(rule.id, now);
      const hasRuleEmitOverride = Object.prototype.hasOwnProperty.call(ruleEmitPreviewMatchedOverrides, ruleId);
      const effectiveRuleEmitPreviewMatched = hasRuleEmitOverride
        ? !!ruleEmitPreviewMatchedOverrides[ruleId]
        : effectiveEmitPreviewMatchedEvents;
      if (effectiveRuleEmitPreviewMatched) {
        eventBus.emit(EVT_RULE_ENGINE_V1_PREVIEW_MATCHED, {
          ruleId: rule.id,
          signalId,
          sourceEvent: String(sourceEvent || ""),
          atMs: now,
        });
      }
      executeRuleActions(rule, {
        signalId,
        sourceEvent,
        atMs: now,
      });
      matchedCount += 1;
      if (effectiveStopOnFirstMatch) break;
      if (effectiveMaxMatchesPerSignal > 0 && matchedCount >= effectiveMaxMatchesPerSignal) break;
    }
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
        for (const signal of signals) {
          if (!signalMatchesPayload(signal, payload)) continue;
          onSignalHit(signal.id, sourceEvent, payload);
          matchedSignalCount += 1;
          if (effectiveStopOnFirstSignalMatchPerEvent) break;
          if (effectiveMaxSignalsPerEvent > 0 && matchedSignalCount >= effectiveMaxSignalsPerEvent) break;
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
