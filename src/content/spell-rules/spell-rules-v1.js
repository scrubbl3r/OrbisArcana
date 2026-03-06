// Rule Engine v1 scaffold.
// Not wired into gameplay runtime yet; this file defines target schema shape.

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
        spells: Object.freeze(["sanctum", "vectus", "rota"]),
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
