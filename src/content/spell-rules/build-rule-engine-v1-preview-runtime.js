function asId(v) {
  return String(v || "").trim().toLowerCase();
}

function asEventName(v) {
  return String(v || "").trim();
}

const DEFAULT_WAKE_WINDOW_ID = "wake_win";

function resolveSignalConditionId(cond) {
  const type = asId(cond && cond.type);
  const id = asId(cond && cond.id);
  if (!id) return "";
  if (type === "signal") return id;
  if (type === "spell" || type === "gesture" || type === "orb_state") {
    if (id.includes(".")) return id;
    return `${type}.${id}`;
  }
  return "";
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
    if (Object.keys(on).length > 0) {
      return { all: [on], any: [] };
    }
  }
  return { all: [], any: [] };
}

export function buildRuleEngineV1PreviewRuntime({
  signals = [],
  windows = [],
  events = [],
  rules = [],
} = {}) {
  const signalById = Object.create(null);
  const signalsBySourceEvent = Object.create(null);
  const windowById = Object.create(null);
  const eventById = Object.create(null);
  const rulesBySignalId = Object.create(null);
  const normalizedRules = [];

  for (const eventDef of Array.isArray(events) ? events : []) {
    const id = asId(eventDef && eventDef.id);
    if (!id) continue;
    eventById[id] = {
      id,
      type: asId(eventDef && eventDef.type),
      defaultArgs: (eventDef && typeof eventDef.defaultArgs === "object" && eventDef.defaultArgs)
        ? { ...eventDef.defaultArgs }
        : {},
    };
  }
  for (const windowDef of Array.isArray(windows) ? windows : []) {
    const id = asId(windowDef && windowDef.id);
    if (!id) continue;
    windowById[id] = {
      id,
      type: asId(windowDef && windowDef.type),
      defaultArgs: (windowDef && typeof windowDef.defaultArgs === "object" && windowDef.defaultArgs)
        ? { ...windowDef.defaultArgs }
        : {},
    };
  }

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
    const { all, any } = getRuleConditions(rule);
    const allSignalIds = all.map((c) => resolveSignalConditionId(c)).filter(Boolean);
    const anySignalIds = any.map((c) => resolveSignalConditionId(c)).filter(Boolean);
    const signalIds = Array.from(new Set(allSignalIds.concat(anySignalIds)));
    const actions = Array.isArray(rule && rule.then)
      ? rule.then.map((a) => ({
          type: asId(a && a.type),
          id: (asId(a && a.type) === "wake_win")
            ? asId((a && a.id) || DEFAULT_WAKE_WINDOW_ID)
            : asId(a && a.id),
          spells: Array.isArray(a && a.spells) ? a.spells.slice() : [],
          overrides: mergeActionOverrides(a),
        }))
      : [];
    const normalizedRule = {
      id,
      signalIds,
      allSignalIds,
      anySignalIds,
      cooldownMs: Math.max(0, Number(rule && rule.cooldownMs) || 0),
      matchWindowMs: Math.max(100, Number(rule && rule.matchWindowMs) || 2000),
      actions,
    };
    normalizedRules.push(normalizedRule);
    for (const signalId of signalIds) {
      if (!rulesBySignalId[signalId]) rulesBySignalId[signalId] = [];
      rulesBySignalId[signalId].push(normalizedRule);
    }
  }

  return {
    signalById,
    windowById,
    eventById,
    signalsBySourceEvent,
    rulesBySignalId,
    rules: normalizedRules,
  };
}
