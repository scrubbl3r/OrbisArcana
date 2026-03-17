import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { buildRulesFromInteractionsV2 } from "./build-rule-engine-from-interactions-v2.js";

const RESERVED_EVENT_KEYS = Object.freeze(new Set(["type", "id", "enabled"]));

function asObj(v) {
  return (v && typeof v === "object" && !Array.isArray(v)) ? v : {};
}

function asText(v) {
  if (typeof v === "string") return v.trim();
  if (v == null) return "";
  return `${v}`.trim();
}

function asId(v) {
  return asText(v).toLowerCase();
}

function normalizeConditionSelector(cond) {
  const type = asId(cond?.type);
  const id = asId(cond?.id);
  if (!type || !id) return "";
  return `${type}:${id}`;
}

function mapEventActionToTrigger(action) {
  const safeAction = asObj(action);
  const trigger = {
    event: asId(safeAction.id),
  };
  if (Object.prototype.hasOwnProperty.call(safeAction, "enabled") && typeof safeAction.enabled === "boolean") {
    trigger.enabled = safeAction.enabled;
  }
  const args = {};
  for (const [key, value] of Object.entries(safeAction)) {
    if (RESERVED_EVENT_KEYS.has(key)) continue;
    args[key] = value;
  }
  if (Object.keys(args).length) trigger.args = args;
  return Object.freeze(trigger);
}

function mapProjectedRuleToOrchestratorRule(rule) {
  const safeRule = asObj(rule);
  const onConditions = Array.isArray(safeRule.on) ? safeRule.on : [];
  const thenActions = Array.isArray(safeRule.then) ? safeRule.then : [];

  const openAction = thenActions.find((action) => asId(action?.type) === "wake_win");
  const eventActions = thenActions.filter((action) => asId(action?.type) === "event");

  const out = {
    id: asText(safeRule.id),
    on: onConditions.map(normalizeConditionSelector).filter(Boolean),
  };
  if (openAction) {
    out.open = {
      spells: Array.isArray(openAction.spells) ? openAction.spells.slice() : [],
    };
    if (Object.prototype.hasOwnProperty.call(openAction, "ttlMs")) out.open.ttlMs = openAction.ttlMs;
    if (Object.prototype.hasOwnProperty.call(openAction, "enabled")) out.open.enabled = openAction.enabled;
  }
  if (eventActions.length) {
    out.trigger = eventActions.map(mapEventActionToTrigger);
  }
  if (Object.prototype.hasOwnProperty.call(safeRule, "enabled")) out.enabled = safeRule.enabled;
  if (Object.prototype.hasOwnProperty.call(safeRule, "priority")) out.priority = safeRule.priority;
  if (Object.prototype.hasOwnProperty.call(safeRule, "cooldownMs")) out.cooldownMs = safeRule.cooldownMs;
  if (Object.prototype.hasOwnProperty.call(safeRule, "matchWindowMs")) out.matchWindowMs = safeRule.matchWindowMs;
  return Object.freeze(out);
}

export function projectOrchestratorV1FromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  const projectedRules = buildRulesFromInteractionsV2(interactionsV2);
  return Object.freeze({
    version: "1",
    enabled: interactionsV2?.enabled !== false,
    defaults: Object.freeze({}),
    rules: Object.freeze(projectedRules.map(mapProjectedRuleToOrchestratorRule)),
  });
}
