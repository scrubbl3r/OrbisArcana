// V2 central interaction authoring SSOT.
// This file is the canonical place for composing trigger/action chains.
// Docs index: docs/rule-engine-v2-docs-index.md
import {
  EVENT_HANDLES_V2,
  SIGNAL_HANDLES_V2,
} from "./entity-handles-v2.js";

const INTERACTIONS_V2_VERSION = "2";
const CONDITION_TYPE_SPELL = "spell";
const CONDITION_TYPE_GESTURE = "gesture";
const CONDITION_TYPE_ORB_STATE = "orb_state";
const ACTION_TYPE_EVENT = "event";
const ACTION_TYPE_WAKE_WIN = "wake_win";
const ORB_STATE_SUPERHEATED = "superheated";
const FIELD_ID = "id";
const FIELD_TYPE = "type";
const FIELD_ON = "on";
const FIELD_ALL = "all";
const FIELD_THEN = "then";
const FIELD_ENABLED = "enabled";
const FIELD_VERSION = "version";
const FIELD_DEFAULTS = "defaults";
const FIELD_RULES = "rules";
const FIELD_WAKE_WIN = "wakeWin";
const FIELD_EVENT = "event";
const FIELD_TTL_MS = "ttlMs";
const FIELD_SPELLS = "spells";
const FIELD_GRACE = "grace";
const FIELD_MS = "ms";
const FIELD_OVERRIDES = "overrides";
const FIELD_STATE = "state";

function makeCondition(type, id) {
  return Object.freeze({ [FIELD_TYPE]: type, [FIELD_ID]: id });
}

function makeEventAction(id, extra = {}) {
  return Object.freeze({ [FIELD_TYPE]: ACTION_TYPE_EVENT, [FIELD_ID]: id, ...extra });
}

function makeWakeWinAction(spells) {
  return Object.freeze({
    [FIELD_TYPE]: ACTION_TYPE_WAKE_WIN,
    [FIELD_SPELLS]: Object.freeze(spells),
  });
}

function makeOrbStateEventAction(state) {
  return makeEventAction(EVENT_HANDLES_V2.ORB_STATE, {
    [FIELD_OVERRIDES]: Object.freeze({ [FIELD_STATE]: state }),
  });
}

function makeRule(id, allConditions, thenActions) {
  return Object.freeze({
    [FIELD_ID]: id,
    [FIELD_ON]: Object.freeze({
      [FIELD_ALL]: Object.freeze(allConditions),
    }),
    [FIELD_THEN]: Object.freeze(thenActions),
  });
}

export const INTERACTIONS_V2_BOOTSTRAP = Object.freeze({
  // Runtime bootstrap policy switch for V2 adapter.
  useInReceiverBootstrap: true,
});

export const INTERACTIONS_V2 = Object.freeze({
  [FIELD_VERSION]: INTERACTIONS_V2_VERSION,
  [FIELD_ENABLED]: true,
  [FIELD_DEFAULTS]: Object.freeze({
    [FIELD_WAKE_WIN]: Object.freeze({ [FIELD_TTL_MS]: 2000 }),
    [FIELD_EVENT]: Object.freeze({
      [FIELD_GRACE]: Object.freeze({ [FIELD_MS]: 500 }),
    }),
  }),
  [FIELD_RULES]: Object.freeze([
    makeRule(
      "r_fridgis_immediate",
      [makeCondition(CONDITION_TYPE_SPELL, SIGNAL_HANDLES_V2.FRIDGIS)],
      [makeEventAction(EVENT_HANDLES_V2.AOE_FROST)]
    ),
    makeRule(
      "r_electrum_immediate",
      [makeCondition(CONDITION_TYPE_SPELL, SIGNAL_HANDLES_V2.ELECTRUM)],
      [makeEventAction(EVENT_HANDLES_V2.AOE_ELECTRIC)]
    ),
    makeRule(
      "r_pyro_immediate",
      [makeCondition(CONDITION_TYPE_SPELL, SIGNAL_HANDLES_V2.PYRO)],
      [makeEventAction(EVENT_HANDLES_V2.AOE_FLAME)]
    ),
    makeRule(
      "r_domus_immediate",
      [makeCondition(CONDITION_TYPE_SPELL, SIGNAL_HANDLES_V2.DOMUS)],
      [makeEventAction(EVENT_HANDLES_V2.TELEPORT_HOME)]
    ),
    makeRule(
      "r_rota_yspin_charged",
      [
        makeCondition(CONDITION_TYPE_SPELL, SIGNAL_HANDLES_V2.ROTA),
        makeCondition(CONDITION_TYPE_GESTURE, SIGNAL_HANDLES_V2.SPIN_Y),
        makeCondition(CONDITION_TYPE_ORB_STATE, SIGNAL_HANDLES_V2.ORB_CHARGED),
      ],
      [
        makeWakeWinAction([
          SIGNAL_HANDLES_V2.ROTA,
          SIGNAL_HANDLES_V2.SANCTUM,
          SIGNAL_HANDLES_V2.VECTUS,
        ]),
        makeEventAction(EVENT_HANDLES_V2.AOE_ELECTRIC, { range: 14 }),
        makeEventAction(EVENT_HANDLES_V2.GRACE),
        makeOrbStateEventAction(ORB_STATE_SUPERHEATED),
      ]
    ),
  ]),
});

const SPELL_PREFIX = `${CONDITION_TYPE_SPELL}.`;

function asLowerTrimmed(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasActionType(actions, expectedType) {
  return actions.some((action) => {
    const type = asLowerTrimmed(action?.[FIELD_TYPE]);
    return type === expectedType;
  });
}

function normalizeSpellConditionId(rawId) {
  const condIdRaw = asLowerTrimmed(rawId);
  if (!condIdRaw) return "";
  return condIdRaw.startsWith(SPELL_PREFIX)
    ? condIdRaw.slice(SPELL_PREFIX.length)
    : condIdRaw;
}

function getRuleOnAll(rule) {
  return Array.isArray(rule?.[FIELD_ON]?.[FIELD_ALL]) ? rule[FIELD_ON][FIELD_ALL] : [];
}

function getRuleThenActions(rule) {
  return Array.isArray(rule?.[FIELD_THEN]) ? rule[FIELD_THEN] : [];
}

function getSingleSpellConditionId(rule) {
  const onAll = getRuleOnAll(rule);
  const cond = onAll.length === 1 ? (onAll[0] || null) : null;
  if (!cond) return "";
  const condType = asLowerTrimmed(cond?.[FIELD_TYPE]);
  if (condType !== CONDITION_TYPE_SPELL) return "";
  const condId = normalizeSpellConditionId(cond?.[FIELD_ID]);
  return condId || "";
}

function hasImmediateEventActionProfile(rule) {
  const actions = getRuleThenActions(rule);
  if (!actions.length) return false;
  if (hasActionType(actions, ACTION_TYPE_WAKE_WIN)) return false;
  return hasActionType(actions, ACTION_TYPE_EVENT);
}

function resolveImmediateSpellId(rule) {
  const condId = getSingleSpellConditionId(rule);
  if (!condId) return "";
  if (!hasImmediateEventActionProfile(rule)) return "";
  return condId;
}

function addUniqueImmediateSpellId(out, seen, spellId) {
  if (!spellId || seen.has(spellId)) return;
  seen.add(spellId);
  out.push(spellId);
}

function getInteractionRules(cfg) {
  return Array.isArray(cfg?.[FIELD_RULES]) ? cfg[FIELD_RULES] : [];
}

function collectImmediateEventSpellIdsFromRules(rules) {
  const out = [];
  const seen = new Set();
  for (const rule of rules) {
    const condId = resolveImmediateSpellId(rule);
    addUniqueImmediateSpellId(out, seen, condId);
  }
  return out;
}

export function collectImmediateEventSpellIdsFromInteractionsV2(cfg = INTERACTIONS_V2) {
  const rules = getInteractionRules(cfg);
  return Object.freeze(collectImmediateEventSpellIdsFromRules(rules));
}
