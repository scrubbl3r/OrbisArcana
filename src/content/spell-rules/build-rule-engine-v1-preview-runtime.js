function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function asEventName(v) {
  return String(v || "").trim();
}

export function buildRuleEngineV1PreviewRuntime({
  signals = [],
  rules = [],
} = {}) {
  const signalById = Object.create(null);
  const signalsBySourceEvent = Object.create(null);
  const rulesBySignalId = Object.create(null);
  const normalizedRules = [];

  for (const signal of Array.isArray(signals) ? signals : []) {
    const id = asId(signal && signal.id);
    if (!id) continue;
    const sourceEvent = asEventName(signal && signal.sourceEvent);
    const where = (signal && typeof signal.where === "object" && signal.where)
      ? { ...signal.where }
      : null;
    const normalized = {
      id,
      type: asId(signal && signal.type),
      sourceEvent,
      where,
    };
    signalById[id] = normalized;
    if (sourceEvent) {
      if (!signalsBySourceEvent[sourceEvent]) signalsBySourceEvent[sourceEvent] = [];
      signalsBySourceEvent[sourceEvent].push(normalized);
    }
  }

  for (const rule of Array.isArray(rules) ? rules : []) {
    const id = asId(rule && rule.id);
    if (!id) continue;
    const on = (rule && typeof rule.on === "object" && rule.on) ? rule.on : {};
    const all = Array.isArray(on.all) ? on.all : [];
    const any = Array.isArray(on.any) ? on.any : [];
    const allSignalIds = all
      .filter((c) => asId(c && c.type) === "signal")
      .map((c) => asId(c && c.id))
      .filter(Boolean);
    const anySignalIds = any
      .filter((c) => asId(c && c.type) === "signal")
      .map((c) => asId(c && c.id))
      .filter(Boolean);
    const signalIds = Array.from(new Set(allSignalIds.concat(anySignalIds)));
    const normalizedRule = {
      id,
      signalIds,
      allSignalIds,
      anySignalIds,
      cooldownMs: Math.max(0, Number(rule && rule.cooldownMs) || 0),
      matchWindowMs: Math.max(100, Number(rule && rule.matchWindowMs) || 2000),
    };
    normalizedRules.push(normalizedRule);
    for (const signalId of signalIds) {
      if (!rulesBySignalId[signalId]) rulesBySignalId[signalId] = [];
      rulesBySignalId[signalId].push(normalizedRule);
    }
  }

  return {
    signalById,
    signalsBySourceEvent,
    rulesBySignalId,
    rules: normalizedRules,
  };
}
