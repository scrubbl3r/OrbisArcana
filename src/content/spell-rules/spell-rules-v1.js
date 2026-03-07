// Rule Engine v1 scaffold.
// Not wired into gameplay runtime yet; this file defines target schema shape.
import { CLASS_SPELL_IDS } from "../spells/spell-runtime-routing-v1.js";

const DEFAULT_WAKE_WIN_CLASS_SPELLS = Object.freeze(
  Array.isArray(CLASS_SPELL_IDS) ? CLASS_SPELL_IDS.slice() : []
);

export const SPELL_RULES_V1 = Object.freeze([
  Object.freeze({
    id: "r_rota_yspin_charged",
    on: Object.freeze({
      all: Object.freeze([
        Object.freeze({ type: "signal", id: "spell.rota" }),
        Object.freeze({ type: "signal", id: "gesture.y_spin" }),
        Object.freeze({ type: "signal", id: "orb_state.charged" }),
      ]),
    }),
    then: Object.freeze([
      Object.freeze({
        type: "wake_win",
        id: "wake_win",
        spells: DEFAULT_WAKE_WIN_CLASS_SPELLS,
      }),
      Object.freeze({
        type: "event",
        id: "electric_aoe",
      }),
      Object.freeze({
        type: "event",
        id: "grace",
        overrides: Object.freeze({ ms: 500 }),
      }),
    ]),
  }),
]);
