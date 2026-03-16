import {
  INTERACTIONS_V2,
  buildRulesFromInteractionsV2,
} from "../../src/content/interactions-v2/index.js";
import { buildRuleEngineFromOrchestratorV1 } from "../../src/content/interactions-v2/build-rule-engine-from-orchestrator-v1.js";
import { failCheck, failCheckWithDetails } from "./check-fail-v2.mjs";
import { reportCheckPass } from "./check-pass-v2.mjs";

const CHECK_TAG = "orchestrator-v1-parity:v2";

const RESERVED_EVENT_KEYS = new Set(["type", "id", "enabled"]);

function normalizeConditionSelector(cond) {
  const type = String(cond && cond.type || "").trim().toLowerCase();
  const id = String(cond && cond.id || "").trim().toLowerCase();
  if (!type || !id) return "";
  return `${type}:${id}`;
}

function mapEventActionToTrigger(action) {
  const trigger = {
    event: String(action && action.id || "").trim().toLowerCase(),
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

  const openAction = thenActions.find((action) => String(action && action.type || "").toLowerCase() === "wake_win");
  const eventActions = thenActions.filter((action) => String(action && action.type || "").toLowerCase() === "event");

  const out = {
    id: String(rule && rule.id || "").trim(),
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

const projectedRules = buildRulesFromInteractionsV2(INTERACTIONS_V2);
if (!Array.isArray(projectedRules) || !projectedRules.length) {
  failCheck(CHECK_TAG, "projected interactions rules missing");
}

const orchestratorProjection = Object.freeze({
  version: "1",
  enabled: true,
  defaults: Object.freeze({}),
  rules: Object.freeze(projectedRules.map(mapProjectedRuleToOrchestratorRule)),
});

let rebuilt;
try {
  rebuilt = buildRuleEngineFromOrchestratorV1({
    orchestratorV1: orchestratorProjection,
    baseRuleEngine: Object.freeze({ version: "2", rules: [] }),
  });
} catch (err) {
  failCheck(CHECK_TAG, `orchestrator projection build failed: ${err instanceof Error ? err.message : String(err)}`);
}

const rebuiltRules = Array.isArray(rebuilt && rebuilt.rules) ? rebuilt.rules : [];
const lhs = JSON.stringify(projectedRules);
const rhs = JSON.stringify(rebuiltRules);
if (lhs !== rhs) {
  failCheckWithDetails(CHECK_TAG, "projection mismatch between interactions and orchestrator compiler", [
    `interactions rules: ${lhs}`,
    `orchestrator rules: ${rhs}`,
  ]);
}

reportCheckPass(CHECK_TAG, "orchestrator projection parity holds against interactions projection");
