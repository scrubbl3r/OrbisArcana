// Data-only event defaults for rule-engine scaffolding.
// Defaults are intentionally minimal and can be extended per event over time.

export const EVENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "electric_aoe",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "flame_aoe",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "frost_aoe",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "grace",
    type: "event",
    defaultArgs: Object.freeze({ ms: 500 }),
  }),
  Object.freeze({
    id: "domus_teleport",
    type: "event",
    defaultArgs: Object.freeze({}),
  }),
  Object.freeze({
    id: "orb_state",
    type: "event",
    defaultArgs: Object.freeze({ state: "normal" }),
  }),
]);

export const EVENT_DEFINITIONS_BY_ID = Object.freeze(
  EVENT_DEFINITIONS.reduce((acc, def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = def;
    return acc;
  }, {})
);

export const EVENT_DEFINITIONS_V1 = EVENT_DEFINITIONS;
export const EVENT_DEFINITIONS_V1_BY_ID = EVENT_DEFINITIONS_BY_ID;
