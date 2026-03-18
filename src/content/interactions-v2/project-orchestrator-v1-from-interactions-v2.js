import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { buildRulesFromInteractionsV2 } from "./build-rule-engine-from-interactions-v2.js";
import {
  asArray,
  asId,
  asObj,
  asText,
  copyOwnKeys,
  mapDefined,
  setEnabledIfBoolean,
} from "./orchestrator-v1-normalizers.js";

const RESERVED_EVENT_KEYS = Object.freeze(new Set(["type", "id", "enabled"]));
const EMPTY_DEFAULTS = Object.freeze({});
const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const SELECTOR_DELIMITER = ":";
const OPEN_COPY_KEYS = Object.freeze(["ttlMs", "enabled"]);
const PROJECTED_RULE_COPY_KEYS = Object.freeze([
  "enabled",
  "priority",
  "cooldownMs",
  "matchWindowMs",
]);

function splitThenActions(thenActions) {
  return thenActions.reduce(
    (acc, action) => {
      const type = asId(action?.type);
      if (type === ACTION_TYPE_WAKE_WIN && !acc.openAction) acc.openAction = action;
      if (type === ACTION_TYPE_EVENT) acc.eventActions.push(action);
      return acc;
    },
    { openAction: null, eventActions: [] }
  );
}

function mapConditionToSelector(cond) {
  const type = asId(cond?.type);
  const id = asId(cond?.id);
  if (!type || !id) return "";
  return `${type}${SELECTOR_DELIMITER}${id}`;
}

function mapEventActionToTrigger(action) {
  const safeAction = asObj(action);
  const trigger = {
    event: asId(safeAction.id),
  };
  setEnabledIfBoolean(trigger, safeAction);
  const args = {};
  for (const [key, value] of Object.entries(safeAction)) {
    if (RESERVED_EVENT_KEYS.has(key)) continue;
    args[key] = value;
  }
  if (Object.keys(args).length) trigger.args = args;
  return Object.freeze(trigger);
}

function buildProjectedTriggerActions(eventActions) {
  if (!eventActions.length) return null;
  return mapDefined(eventActions, mapEventActionToTrigger);
}

function buildProjectedOpenAction(openAction) {
  if (!openAction) return null;
  const open = {
    spells: asArray(openAction.spells).slice(),
  };
  copyOwnKeys(open, openAction, OPEN_COPY_KEYS);
  return open;
}

function buildProjectedRuleBase(safeRule) {
  return {
    id: asText(safeRule.id),
    on: mapDefined(asArray(safeRule.on), mapConditionToSelector),
  };
}

function buildProjectedRule(rule) {
  const safeRule = asObj(rule);
  const thenActions = asArray(safeRule.then);
  const { openAction, eventActions } = splitThenActions(thenActions);
  const out = buildProjectedRuleBase(safeRule);
  const openProjection = buildProjectedOpenAction(openAction);
  if (openProjection) out.open = openProjection;
  const projectedTriggers = buildProjectedTriggerActions(eventActions);
  if (projectedTriggers) out.trigger = projectedTriggers;
  copyOwnKeys(out, safeRule, PROJECTED_RULE_COPY_KEYS);
  return Object.freeze(out);
}

export function projectOrchestratorV1FromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  const projectedRules = buildRulesFromInteractionsV2(interactionsV2);
  return Object.freeze({
    version: "1",
    enabled: interactionsV2?.enabled !== false,
    defaults: EMPTY_DEFAULTS,
    rules: Object.freeze(mapDefined(projectedRules, buildProjectedRule)),
  });
}
