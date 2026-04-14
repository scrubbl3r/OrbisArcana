// Data-only event defaults for rule-engine scaffolding.
// Defaults are intentionally minimal and can be extended per event over time.

export const EVENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "aoe_electric",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "aoe_flame",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "aoe_frost",
    type: "event",
    defaultArgs: Object.freeze({ ms: 900 }),
  }),
  Object.freeze({
    id: "teleport",
    type: "event",
    defaultArgs: Object.freeze({}),
  }),
  Object.freeze({
    id: "shockwave",
    type: "event",
    defaultArgs: Object.freeze({}),
  }),
  Object.freeze({
    id: "bubble_shield",
    type: "event",
    defaultArgs: Object.freeze({}),
  }),
  Object.freeze({
    id: "colorize",
    type: "event",
    defaultArgs: Object.freeze({ r: 1, g: 1, b: 1, alpha: 1, fadeInMs: 0, fadeOutMs: 0 }),
  }),
  Object.freeze({
    id: "orb_state",
    type: "event",
    defaultArgs: Object.freeze({ state: "normal" }),
  }),
  Object.freeze({
    id: "cast_loaded_ud",
    type: "event",
    defaultArgs: Object.freeze({}),
  }),
  Object.freeze({
    id: "cast_loaded_lr",
    type: "event",
    defaultArgs: Object.freeze({}),
  }),
  Object.freeze({
    id: "cast_loaded_fb",
    type: "event",
    defaultArgs: Object.freeze({}),
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
