// Data-only event defaults for Rule Engine v1 scaffolding.
// Defaults are intentionally minimal and can be extended per event over time.

export const EVENT_DEFINITIONS_V1 = Object.freeze([
  Object.freeze({
    id: "electric_aoe",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "grace",
    type: "event",
    defaultArgs: Object.freeze({ ms: 500 }),
  }),
  Object.freeze({
    id: "orb_state",
    type: "event",
    defaultArgs: Object.freeze({ state: "normal" }),
  }),
]);

export const EVENT_DEFINITIONS_V1_BY_ID = Object.freeze(
  EVENT_DEFINITIONS_V1.reduce((acc, def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = def;
    return acc;
  }, {})
);
