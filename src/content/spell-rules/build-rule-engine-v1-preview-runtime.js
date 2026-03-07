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
  const collectedRules = [];

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
    if (rule && rule.enabled === false) continue;
    const { all, any } = getRuleConditions(rule);
    const allSignalIds = all.map((c) => resolveSignalConditionId(c)).filter(Boolean);
    const anySignalIds = any.map((c) => resolveSignalConditionId(c)).filter(Boolean);
    const signalIds = Array.from(new Set(allSignalIds.concat(anySignalIds)));
    const actions = getRuleActions(rule)
      .filter((a) => !(a && a.enabled === false))
      .map((a) => ({
        type: asId(a && a.type),
        id: (asId(a && a.type) === "wake_win")
          ? asId((a && a.id) || DEFAULT_WAKE_WINDOW_ID)
          : asId(a && a.id),
        spells: Array.isArray(a && a.spells) ? a.spells.slice() : [],
        overrides: resolveActionArgs(a),
      }));
    const normalizedRule = {
      id,
      signalIds,
      allSignalIds,
      anySignalIds,
      priority: Number.isFinite(Number(rule && rule.priority)) ? Number(rule.priority) : 0,
      cooldownMs: Math.max(0, Number(rule && rule.cooldownMs) || 0),
      matchWindowMs: Math.max(100, Number(rule && rule.matchWindowMs) || 2000),
      actions,
    };
    collectedRules.push({
      sourceOrder: collectedRules.length,
      rule: normalizedRule,
    });
  }

  collectedRules.sort((a, b) => {
    const pa = Number(a && a.rule && a.rule.priority) || 0;
    const pb = Number(b && b.rule && b.rule.priority) || 0;
    if (pb !== pa) return pb - pa;
    return Number(a && a.sourceOrder) - Number(b && b.sourceOrder);
  });

  for (const entry of collectedRules) {
    const normalizedRule = entry.rule;
    normalizedRules.push(normalizedRule);
    for (const signalId of normalizedRule.signalIds) {
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
