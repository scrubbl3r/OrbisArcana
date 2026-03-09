// Rule Engine v1 scaffold.
// Not wired into gameplay runtime yet; this file defines target schema shape.
import { WAKE_WINDOW_SPELL_IDS } from "../spells/spell-runtime-routing-v1.js";

const DEFAULT_WAKE_WIN_SPELLS = Object.freeze(
  Array.isArray(WAKE_WINDOW_SPELL_IDS) ? WAKE_WINDOW_SPELL_IDS.slice() : []
);

export const SPELL_RULES_V1 = Object.freeze([
  Object.freeze({
    id: "r_rota_yspin_charged",
    on: Object.freeze([
      Object.freeze({ type: "SPELL", id: "ROTA" }),
      Object.freeze({ type: "GESTURE", id: "Y_SPIN" }),
      Object.freeze({ type: "ORB_STATE", id: "CHARGED" }),
    ]),
    then: Object.freeze([
      Object.freeze({
        type: "WAKE_WIN",
        spells: DEFAULT_WAKE_WIN_SPELLS,
        ttlMs: 2000,
      }),
      Object.freeze({
        type: "EVENT",
        id: "ELECTRIC_AOE",
        range: 14,
      }),
      Object.freeze({
        type: "EVENT",
        id: "GRACE",
        ms: 500,
      }),
      Object.freeze({
        type: "EVENT",
        id: "ORB_STATE",
        state: "superheated",
      }),
    ]),
  }),
]);
