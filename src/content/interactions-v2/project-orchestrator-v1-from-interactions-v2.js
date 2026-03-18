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
  setEnabledIfBoolean(trigger, safeAction);
  const args = {};
  for (const [key, value] of Object.entries(safeAction)) {
    if (RESERVED_EVENT_KEYS.has(key)) continue;
    args[key] = value;
  }
  if (Object.keys(args).length) trigger.args = args;
  return Object.freeze(trigger);
}

function mapRuleOnSelectors(onConditions) {
  return mapDefined(onConditions, normalizeConditionSelector);
}

function mapOpenAction(openAction) {
  if (!openAction) return null;
  const open = {
    spells: asArray(openAction.spells).slice(),
  };
  copyOwnKeys(open, openAction, ["ttlMs", "enabled"]);
  return open;
}

function partitionThenActions(thenActions) {
  return thenActions.reduce(
    (acc, action) => {
      const type = asId(action?.type);
      if (type === "wake_win" && !acc.openAction) acc.openAction = action;
      if (type === "event") acc.eventActions.push(action);
      return acc;
    },
    { openAction: null, eventActions: [] }
  );
}

function mapEventActionsToTriggers(eventActions) {
  return mapDefined(eventActions, mapEventActionToTrigger);
}

function mapProjectedRuleToOrchestratorRule(rule) {
  const safeRule = asObj(rule);
  const onConditions = asArray(safeRule.on);
  const thenActions = asArray(safeRule.then);
  const { openAction, eventActions } = partitionThenActions(thenActions);

  const out = {
    id: asText(safeRule.id),
    on: mapRuleOnSelectors(onConditions),
  };
  const mappedOpen = mapOpenAction(openAction);
  if (mappedOpen) out.open = mappedOpen;
  if (eventActions.length) {
    out.trigger = mapEventActionsToTriggers(eventActions);
  }
  copyOwnKeys(out, safeRule, ["enabled", "priority", "cooldownMs", "matchWindowMs"]);
  return Object.freeze(out);
}

function mapProjectedRules(projectedRules) {
  return Object.freeze(mapDefined(projectedRules, mapProjectedRuleToOrchestratorRule));
}

function buildProjectedEnvelope(interactionsV2, projectedRules) {
  return Object.freeze({
    version: "1",
    enabled: interactionsV2?.enabled !== false,
    defaults: EMPTY_DEFAULTS,
    rules: mapProjectedRules(projectedRules),
  });
}

export function projectOrchestratorV1FromInteractionsV2(interactionsV2 = INTERACTIONS_V2) {
  const projectedRules = buildRulesFromInteractionsV2(interactionsV2);
  return buildProjectedEnvelope(interactionsV2, projectedRules);
}
