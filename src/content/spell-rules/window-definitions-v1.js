// Data-only window defaults for Rule Engine v1 scaffolding.
// `spells` allowed in a window are rule-instance data, not hardcoded here.

export const WINDOW_DEFINITIONS_V1 = Object.freeze([
  Object.freeze({
    id: "wake_win",
    type: "wake_win",
    defaultArgs: Object.freeze({
      ttlMs: 1500,
    }),
  }),
]);

export const WINDOW_DEFINITIONS_V1_BY_ID = Object.freeze(
  WINDOW_DEFINITIONS_V1.reduce((acc, def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = def;
    return acc;
  }, {})
);
