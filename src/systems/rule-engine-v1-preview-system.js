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
  if (Object.prototype.hasOwnProperty.call(where, "gte")) {
    return Number(value) >= Number(where.gte);
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
  const actionArgOverrides = (schema && schema.actionArgOverrides && typeof schema.actionArgOverrides === "object")
    ? schema.actionArgOverrides
    : Object.create(null);
  const unsub = [];
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
    if (!executeActions) return;
    const actions = Array.isArray(rule && rule.actions) ? rule.actions : [];
    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      const type = String(action && action.type || "").trim().toLowerCase();
      const id = String(action && action.id || "").trim().toLowerCase();
      const ruleId = String(rule && rule.id || "");
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
    let matchedCount = 0;
    for (const rule of candidates) {
      if (!ruleMatches(rule, lastSeenAtBySignalId, now, matchWindowScale)) continue;
      const cooldownMs = Math.max(0, Number(rule.cooldownMs) || 0) * cooldownScale;
      const lastMatchedAt = Number(lastMatchAtByRuleId.get(rule.id) || 0);
      if (cooldownMs > 0 && (now - lastMatchedAt) < cooldownMs) continue;
      lastMatchAtByRuleId.set(rule.id, now);
      eventBus.emit(EVT_RULE_ENGINE_V1_PREVIEW_MATCHED, {
        ruleId: rule.id,
        signalId,
        sourceEvent: String(sourceEvent || ""),
        atMs: now,
      });
      executeRuleActions(rule, {
        signalId,
        sourceEvent,
        atMs: now,
      });
      matchedCount += 1;
      if (stopOnFirstMatch) break;
      if (maxMatchesPerSignal > 0 && matchedCount >= maxMatchesPerSignal) break;
    }
  }

  function start() {
    for (const sourceEvent of Object.keys(runtime.signalsBySourceEvent)) {
      const signals = runtime.signalsBySourceEvent[sourceEvent] || [];
      if (!signals.length) continue;
      unsub.push(eventBus.on(sourceEvent, (payload = {}) => {
        let matchedSignalCount = 0;
        for (const signal of signals) {
          if (!signalMatchesPayload(signal, payload)) continue;
          onSignalHit(signal.id, sourceEvent, payload);
          matchedSignalCount += 1;
          if (stopOnFirstSignalMatchPerEvent) break;
          if (maxSignalsPerEvent > 0 && matchedSignalCount >= maxSignalsPerEvent) break;
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
