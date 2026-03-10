// V2 central interaction authoring SSOT.
// This file is the canonical place for composing trigger/action chains.
import {
  EVENT_HANDLES_V2,
  SIGNAL_HANDLES_V2,
} from "./entity-handles-v2.js";

export const INTERACTIONS_V2_BOOTSTRAP = Object.freeze({
  // V2 adapter runtime cutover.
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
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.FROST_AOE }),
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
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.ELECTRIC_AOE }),
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
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.FLAME_AOE }),
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
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.DOMUS_TELEPORT }),
      ]),
    }),
    Object.freeze({
      id: "r_rota_yspin_charged",
      on: Object.freeze({
        all: Object.freeze([
          Object.freeze({ type: "spell", id: SIGNAL_HANDLES_V2.ROTA }),
          Object.freeze({ type: "gesture", id: SIGNAL_HANDLES_V2.Y_SPIN }),
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
        Object.freeze({ type: "event", id: EVENT_HANDLES_V2.ELECTRIC_AOE, range: 14 }),
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
