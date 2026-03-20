import { INTERACTIONS_V2 } from "./interactions-v2.js";
import { buildRulesFromInteractionsV2 } from "./build-rule-engine-from-interactions-v2.js";
import {
  asArray,
  asId,
  asObj,
  asText,
  copyOwnKeys,
  hasNonEmptyArray,
  mapDefined,
  setEnabledIfBoolean,
} from "./orchestrator-v1-normalizers.js";

const ACTION_TYPE_WAKE_WIN = "wake_win";
const ACTION_TYPE_EVENT = "event";
const ORCHESTRATOR_V1_VERSION = "1";
const ENABLED_FALSE = false;
const FIELD_EVENT = "event";
const FIELD_ARGS = "args";
const FIELD_WORDS = "words";
const FIELD_SPELLS = "spells";
const FIELD_ID = "id";
const FIELD_ON = "on";
const FIELD_THEN = "then";
const FIELD_TYPE = "type";
const FIELD_OPEN = "open";
const FIELD_TRIGGER = "trigger";
const FIELD_TTL_MS = "ttlMs";
const FIELD_ENABLED = "enabled";
const FIELD_PRIORITY = "priority";
const FIELD_COOLDOWN_MS = "cooldownMs";
const FIELD_MATCH_WINDOW_MS = "matchWindowMs";
const FIELD_DEFAULTS = "defaults";
const FIELD_VERSION = "version";
const FIELD_RULES = "rules";
const OPEN_COPY_KEYS = Object.freeze([FIELD_TTL_MS, FIELD_ENABLED]);
const RULE_COPY_KEYS = Object.freeze([
  FIELD_ENABLED,
  FIELD_PRIORITY,
  FIELD_COOLDOWN_MS,
  FIELD_MATCH_WINDOW_MS,
]);
const EMPTY_DEFAULTS = Object.freeze({});
const TRIGGER_RESERVED_KEYS = Object.freeze(new Set([FIELD_TYPE, FIELD_ID, FIELD_ENABLED]));

export function projectOrchestratorV1FromInteractionsV2(interactionsV2Input = INTERACTIONS_V2) {
  const sourceInteractions = interactionsV2Input || INTERACTIONS_V2;
  return Object.freeze({
    [FIELD_VERSION]: ORCHESTRATOR_V1_VERSION,
    [FIELD_ENABLED]: asObj(sourceInteractions)[FIELD_ENABLED] !== ENABLED_FALSE,
    [FIELD_DEFAULTS]: EMPTY_DEFAULTS,
    [FIELD_RULES]: Object.freeze(
      mapDefined(buildRulesFromInteractionsV2(sourceInteractions), (rule) => {
        const safeRule = asObj(rule);
        const out = {
          [FIELD_ID]: asText(safeRule[FIELD_ID]),
          [FIELD_ON]: mapDefined(asArray(safeRule[FIELD_ON]), (cond) => {
            const type = asId(cond?.[FIELD_TYPE]);
            const id = asId(cond?.[FIELD_ID]);
            if (!type || !id) return "";
            return `${type}:${id}`;
          }),
        };
        const { openAction, eventActions } = asArray(safeRule[FIELD_THEN]).reduce((acc, action) => {
          const type = asId(action?.[FIELD_TYPE]);
          if (type === ACTION_TYPE_WAKE_WIN && !acc.openAction) acc.openAction = action;
          if (type === ACTION_TYPE_EVENT) acc.eventActions.push(action);
          return acc;
        }, { openAction: null, eventActions: [] });
        if (openAction) {
          const openWordsRaw = Object.hasOwn(asObj(openAction), FIELD_WORDS)
            ? openAction?.[FIELD_WORDS]
            : openAction?.[FIELD_SPELLS];
          const openWords = asArray(openWordsRaw).slice();
          const open = {
            [FIELD_WORDS]: openWords,
            [FIELD_SPELLS]: openWords,
          };
          copyOwnKeys(open, openAction, OPEN_COPY_KEYS);
          out[FIELD_OPEN] = open;
        }
        if (hasNonEmptyArray(eventActions)) {
          out[FIELD_TRIGGER] = mapDefined(eventActions, (action) => {
            const safeAction = asObj(action);
            const trigger = {
              [FIELD_EVENT]: asId(safeAction[FIELD_ID]),
            };
            setEnabledIfBoolean(trigger, safeAction);
            const args = {};
            for (const [key, value] of Object.entries(safeAction)) {
              if (TRIGGER_RESERVED_KEYS.has(key)) continue;
              args[key] = value;
            }
            if (Object.keys(args).length > 0) trigger[FIELD_ARGS] = args;
            return Object.freeze(trigger);
          });
        }
        copyOwnKeys(out, safeRule, RULE_COPY_KEYS);
        return Object.freeze(out);
      })
    ),
  });
}
