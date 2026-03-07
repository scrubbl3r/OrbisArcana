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
      Object.freeze({ type: "spell", id: "rota" }),
      Object.freeze({ type: "gesture", id: "y_spin" }),
      Object.freeze({ type: "orb_state", id: "charged" }),
    ]),
    then: Object.freeze([
      Object.freeze({
        type: "wake_win",
        spells: DEFAULT_WAKE_WIN_SPELLS,
        ttlMs: 2000,
      }),
      Object.freeze({
        type: "event",
        id: "electric_aoe",
        range: 14,
      }),
      Object.freeze({
        type: "event",
        id: "grace",
        ms: 500,
      }),
      Object.freeze({
        type: "event",
        id: "orb_state",
        state: "superheated",
      }),
    ]),
  }),
]);
