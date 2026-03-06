// Data-only signal catalog for Rule Engine v1 scaffolding.
// Runtime cutover will consume these IDs in a later slice.

export const SIGNAL_DEFINITIONS_V1 = Object.freeze([
  Object.freeze({ id: "spell.rota", type: "spell" }),
  Object.freeze({ id: "spell.sanctum", type: "spell" }),
  Object.freeze({ id: "spell.vectus", type: "spell" }),
  Object.freeze({ id: "spell.orbis", type: "spell" }),
  Object.freeze({ id: "gesture.y_spin", type: "gesture" }),
  Object.freeze({ id: "orb_state.charged", type: "orb_state" }),
]);

export const SIGNAL_DEFINITIONS_V1_BY_ID = Object.freeze(
  SIGNAL_DEFINITIONS_V1.reduce((acc, def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = def;
    return acc;
  }, {})
);
