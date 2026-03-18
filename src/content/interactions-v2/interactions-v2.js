// V2 central interaction authoring SSOT.
// This file is the canonical place for composing trigger/action chains.
// Docs index: docs/rule-engine-v2-docs-index.md
import {
  EVENT_HANDLES_V2,
  SIGNAL_HANDLES_V2,
} from "./entity-handles-v2.js";

export const INTERACTIONS_V2_BOOTSTRAP = Object.freeze({
  // Runtime bootstrap policy switch for V2 adapter.
  useInReceiverBootstrap: true,
});

export const INTERACTIONS_V2 = Object.freeze({
  version: "2",
  enabled: true,
  defaults: Object.freeze({
    wakeWin: Object.freeze({ ttlMs: 2000 }),
    event: Object.freeze({
      grace: Object.freeze({ ms: 500 }),
    }),
  }),
  rules: Object.freeze([
    Object.freeze({
      id: "r_fridgis_immediate",
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: SIGNAL_HANDLES_V2.FRIDGIS }),
        ]),
      }),
      then: Object.freeze([
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.AOE_FROST }),
      ]),
    }),
    Object.freeze({
      id: "r_electrum_immediate",
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: SIGNAL_HANDLES_V2.ELECTRUM }),
        ]),
      }),
      then: Object.freeze([
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.AOE_ELECTRIC }),
      ]),
    }),
    Object.freeze({
      id: "r_pyro_immediate",
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: SIGNAL_HANDLES_V2.PYRO }),
        ]),
      }),
      then: Object.freeze([
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.AOE_FLAME }),
      ]),
    }),
    Object.freeze({
      id: "r_domus_immediate",
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: SIGNAL_HANDLES_V2.DOMUS }),
        ]),
      }),
      then: Object.freeze([
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.TELEPORT_HOME }),
      ]),
    }),
    Object.freeze({
      id: "r_rota_yspin_charged",
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: SIGNAL_HANDLES_V2.ROTA }),
          Object.freeze({ type: "gesture", id: SIGNAL_HANDLES_V2.SPIN_Y }),
          Object.freeze({ type: "orb_state", id: SIGNAL_HANDLES_V2.ORB_CHARGED }),
        ]),
      }),
      then: Object.freeze([
        Object.freeze({
          type: "wake_win",
          spells: Object.freeze([
            SIGNAL_HANDLES_V2.ROTA,
            SIGNAL_HANDLES_V2.SANCTUM,
            SIGNAL_HANDLES_V2.VECTUS,
          ]),
        }),
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.AOE_ELECTRIC, range: 14 }),
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.GRACE }),
        Object.freeze({
          type: "event",
          id: EVENT_HANDLES_V2.ORB_STATE,
          overrides: Object.freeze({ state: "superheated" }),
        }),
      ]),
    }),
  ]),
});

const SPELL_PREFIX = "spell.";

function asLowerTrimmed(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hasActionType(actions, expectedType) {
  return actions.some((action) => {
    const type = asLowerTrimmed(action?.type);
    return type === expectedType;
  });
}

function collectRuleActions(rule) {
  return Array.isArray(rule?.then) ? rule.then : [];
}

function getSingleSpellConditionId(rule) {
  const onAll = Array.isArray(rule?.on?.all) ? rule.on.all : [];
  if (onAll.length !== 1) return "";
  const cond = onAll[0];
  const condType = asLowerTrimmed(cond?.type);
  const condIdRaw = asLowerTrimmed(cond?.id);
  if (condType !== "spell" || !condIdRaw) return "";
  const condId = condIdRaw.startsWith(SPELL_PREFIX)
    ? condIdRaw.slice(SPELL_PREFIX.length)
    : condIdRaw;
  return condId || "";
}

function hasImmediateEventActionProfile(rule) {
  const actions = collectRuleActions(rule);
  if (!actions.length) return false;
  if (hasActionType(actions, "wake_win")) return false;
  return hasActionType(actions, "event");
}

export function collectImmediateEventSpellIdsFromInteractionsV2(cfg = INTERACTIONS_V2) {
  const out = [];
  const seen = new Set();
  const rules = Array.isArray(cfg?.rules) ? cfg.rules : [];
  for (const rule of rules) {
    const condId = getSingleSpellConditionId(rule);
    if (!condId) continue;
    if (!hasImmediateEventActionProfile(rule)) continue;

    if (!seen.has(condId)) {
      seen.add(condId);
      out.push(condId);
    }
  }
  return Object.freeze(out);
}
