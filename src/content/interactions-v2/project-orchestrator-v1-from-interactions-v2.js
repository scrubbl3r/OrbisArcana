import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { buildRulesFromInteractionsV2 } from "./build-rule-engine-from-interactions-v2.js";

const RESERVED_EVENT_KEYS = new Set(["type", "id", "enabled"]);

function asText(v) {
  return String(v == null ? "" : v).trim();
}

function asId(v) {
  return asText(v).toLowerCase();
}

function normalizeConditionSelector(cond) {
  const type = asId(cond && cond.type);
  const id = asId(cond && cond.id);
  if (!type || !id) return "";
  return `${type}:${id}`;
}

function mapEventActionToTrigger(action) {
  const trigger = {
    event: asId(action && action.id),
  };
  if (Object.prototype.hasOwnProperty.call(action || {}, "enabled") && typeof action.enabled === "boolean") {
    trigger.enabled = action.enabled;
  }
  const args = {};
  for (const [key, value] of Object.entries(action || {})) {
    if (RESERVED_EVENT_KEYS.has(key)) continue;
    args[key] = value;
  }
  if (Object.keys(args).length) trigger.args = args;
  return Object.freeze(trigger);
}

function mapProjectedRuleToOrchestratorRule(rule) {
  const onConditions = Array.isArray(rule && rule.on) ? rule.on : [];
  const thenActions = Array.isArray(rule && rule.then) ? rule.then : [];

  const openAction = thenActions.find((action) => asId(action && action.type) === "wake_win");
  const eventActions = thenActions.filter((action) => asId(action && action.type) === "event");

  const out = {
    id: asText(rule && rule.id),
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
  if (Object.prototype.hasOwnProperty.call(rule || {}, "enabled")) out.enabled = rule.enabled;
  if (Object.prototype.hasOwnProperty.call(rule || {}, "priority")) out.priority = rule.priority;
  if (Object.prototype.hasOwnProperty.call(rule || {}, "cooldownMs")) out.cooldownMs = rule.cooldownMs;
  if (Object.prototype.hasOwnProperty.call(rule || {}, "matchWindowMs")) out.matchWindowMs = rule.matchWindowMs;
  return Object.freeze(out);
}

export function projectOrchestratorV1FromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  const projectedRules = buildRulesFromInteractionsV2(interactionsV2);
  return Object.freeze({
    version: "1",
    enabled: interactionsV2 && interactionsV2.enabled !== false,
    defaults: Object.freeze({}),
    rules: Object.freeze(projectedRules.map(mapProjectedRuleToOrchestratorRule)),
  });
}
