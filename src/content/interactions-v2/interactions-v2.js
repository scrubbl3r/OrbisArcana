// V2 central interaction authoring SSOT.
// This file is the canonical place for composing trigger/action chains.

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
      id: "r_rota_yspin_charged",
      enabled: true,
      priority: 50,
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: "rota" }),
          Object.freeze({ type: "gesture", id: "Y_SPIN" }),
          Object.freeze({ type: "orb_state", id: "charged" }),
        ]),
      }),
      then: Object.freeze([
        Object.freeze({ type: "wake_win", spells: Object.freeze(["sanctum", "vectus"]) }),
        Object.freeze({ type: "event", id: "electric_aoe" }),
        Object.freeze({ type: "event", id: "grace" }),
        Object.freeze({ type: "event", id: "orb_state", overrides: Object.freeze({ state: "superheated" }) }),
      ]),
    }),
  ]),
});

