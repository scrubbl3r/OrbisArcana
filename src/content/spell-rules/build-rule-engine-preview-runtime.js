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
  if (type === "word") {
    if (id.startsWith("word.")) return `spell.${id.slice("word.".length)}`;
    if (id.startsWith("spell.")) return id;
    if (id.includes(".")) return id;
    return `spell.${id}`;
  }
  if (type === "spin") {
    if (id.startsWith("spin.")) return id;
    if (id === "x" || id === "y" || id === "z") return `spin.${id}`;
    if (id === "spin_x") return "spin.x";
    if (id === "spin_y") return "spin.y";
    if (id === "spin_z") return "spin.z";
    return "";
  }
  if (type === "shake") {
    if (id.startsWith("shake.")) return id;
    if (id === "ud" || id === "lr" || id === "fb") return `shake.${id}`;
    if (id === "shake_ud") return "shake.ud";
    if (id === "shake_lr") return "shake.lr";
    if (id === "shake_fb") return "shake.fb";
    return "";
  }
  if (type === "spell" || type === "orb_state") {
    if (id.includes(".")) return id;
    return `${type}.${id}`;
  }
  return "";
}

function resolveActionArgs(action) {
  const base = (action && typeof action.overrides === "object" && action.overrides)
    ? { ...action.overrides }
    : {};
  const RESERVED_KEYS = new Set(["type", "id", "words", "spells", "overrides", "enabled", "windowId", "spell", "slot"]);
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

function parseStringList(raw) {
  if (typeof raw === "string") {
    const token = String(raw || "").trim();
    return token ? [token] : [];
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

export function buildRuleEnginePreviewRuntime({
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
    const enabled = !(eventDef && eventDef.enabled === false);
    eventById[id] = {
      id,
      type: asId(eventDef && eventDef.type),
      enabled,
      defaultArgs: (eventDef && typeof eventDef.defaultArgs === "object" && eventDef.defaultArgs)
        ? { ...eventDef.defaultArgs }
        : {},
    };
  }
  for (const windowDef of Array.isArray(windows) ? windows : []) {
    const id = asId(windowDef && windowDef.id);
    if (!id) continue;
    const enabled = !(windowDef && windowDef.enabled === false);
    windowById[id] = {
      id,
      type: asId(windowDef && windowDef.type),
      enabled,
      defaultArgs: (windowDef && typeof windowDef.defaultArgs === "object" && windowDef.defaultArgs)
        ? { ...windowDef.defaultArgs }
        : {},
    };
  }

  for (let signalIndex = 0; signalIndex < (Array.isArray(signals) ? signals.length : 0); signalIndex += 1) {
    const signal = signals[signalIndex];
    const id = asId(signal && signal.id);
    if (!id) continue;
    const sourceEvent = asEventName(signal && signal.sourceEvent);
    const enabled = !(signal && signal.enabled === false);
    const priority = Number.isFinite(Number(signal && signal.priority)) ? Number(signal.priority) : 0;
    const where = (signal && typeof signal.where === "object" && signal.where)
      ? { ...signal.where }
      : null;
    const normalized = {
      id,
      type: asId(signal && signal.type),
      sourceEvent,
      enabled,
      priority,
      sourceOrder: signalIndex,
      where,
    };
    signalById[id] = normalized;
    if (enabled && sourceEvent) {
      if (!signalsBySourceEvent[sourceEvent]) signalsBySourceEvent[sourceEvent] = [];
      signalsBySourceEvent[sourceEvent].push(normalized);
    }
  }
  for (const sourceEvent of Object.keys(signalsBySourceEvent)) {
    const items = signalsBySourceEvent[sourceEvent];
    if (!Array.isArray(items) || items.length < 2) continue;
    items.sort((a, b) => {
      const pa = Number(a && a.priority) || 0;
      const pb = Number(b && b.priority) || 0;
      if (pb !== pa) return pb - pa;
      const oa = Number(a && a.sourceOrder) || 0;
      const ob = Number(b && b.sourceOrder) || 0;
      return oa - ob;
    });
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
      .map((a) => {
        const words = Array.isArray(a && a.words)
          ? a.words.slice()
          : (Array.isArray(a && a.spells) ? a.spells.slice() : []);
        return {
          type: asId(a && a.type),
          id: (asId(a && a.type) === "wake_win")
            ? asId((a && a.id) || DEFAULT_WAKE_WINDOW_ID)
            : asId(a && a.id),
          windowId: asId(a && a.windowId),
          spell: asId(a && a.spell),
          slot: String(a && a.slot || "").trim().toUpperCase(),
          words,
          spells: words.slice(),
          overrides: resolveActionArgs(a),
        };
      });
    const requiresWindowIds = parseStringList(rule && rule.requires);
    const consumeWindowIds = parseStringList(rule && rule.consume);
    const normalizedRule = {
      id,
      signalIds,
      allSignalIds,
      anySignalIds,
      priority: Number.isFinite(Number(rule && rule.priority)) ? Number(rule.priority) : 0,
      cooldownMs: Math.max(0, Number(rule && rule.cooldownMs) || 0),
      matchWindowMs: Math.max(100, Number(rule && rule.matchWindowMs) || 2000),
      requiresWindowIds,
      consumeWindowIds,
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
