import { buildRuleEngineV1PreviewRuntime } from "../content/spell-rules/index.js";

const EVT_RULE_ENGINE_V1_PREVIEW_MATCHED = "rule_engine.v1.preview_matched";

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

function ruleMatches(runtimeRule, lastSeenAtBySignalId, now) {
  const maxAgeMs = Math.max(100, Number(runtimeRule && runtimeRule.matchWindowMs) || 2000);
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
  nowMs = () => Date.now(),
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function" || typeof eventBus.emit !== "function") {
    throw new Error("createRuleEngineV1PreviewSystem requires eventBus.on/eventBus.emit");
  }
  const runtime = buildRuleEngineV1PreviewRuntime({
    signals: schema && Array.isArray(schema.signals) ? schema.signals : [],
    rules: schema && Array.isArray(schema.rules) ? schema.rules : [],
  });
  const unsub = [];
  const lastSeenAtBySignalId = new Map();
  const lastMatchAtByRuleId = new Map();

  function onSignalHit(signalId, sourceEvent, payload = {}) {
    const now = Number(payload && payload.atMs) || nowMs();
    lastSeenAtBySignalId.set(signalId, now);
    const candidates = runtime.rulesBySignalId[signalId] || [];
    for (const rule of candidates) {
      if (!ruleMatches(rule, lastSeenAtBySignalId, now)) continue;
      const cooldownMs = Math.max(0, Number(rule.cooldownMs) || 0);
      const lastMatchedAt = Number(lastMatchAtByRuleId.get(rule.id) || 0);
      if (cooldownMs > 0 && (now - lastMatchedAt) < cooldownMs) continue;
      lastMatchAtByRuleId.set(rule.id, now);
      eventBus.emit(EVT_RULE_ENGINE_V1_PREVIEW_MATCHED, {
        ruleId: rule.id,
        signalId,
        sourceEvent: String(sourceEvent || ""),
        atMs: now,
      });
    }
  }

  function start() {
    for (const sourceEvent of Object.keys(runtime.signalsBySourceEvent)) {
      const signals = runtime.signalsBySourceEvent[sourceEvent] || [];
      if (!signals.length) continue;
      unsub.push(eventBus.on(sourceEvent, (payload = {}) => {
        for (const signal of signals) {
          if (!signalMatchesPayload(signal, payload)) continue;
          onSignalHit(signal.id, sourceEvent, payload);
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
