// Data-only signal catalog for Rule Engine v1 scaffolding.
// Runtime cutover will consume these IDs in a later slice.

export const SIGNAL_DEFINITIONS_V1 = Object.freeze([
  Object.freeze({
    id: "spell.rota",
    type: "spell",
    sourceEvent: "voice.spell_detected",
    where: Object.freeze({ path: "spell.id", eq: "rota" }),
  }),
  Object.freeze({
    id: "spell.sanctum",
    type: "spell",
    sourceEvent: "voice.spell_detected",
    where: Object.freeze({ path: "spell.id", eq: "sanctum" }),
  }),
  Object.freeze({
    id: "spell.vectus",
    type: "spell",
    sourceEvent: "voice.spell_detected",
    where: Object.freeze({ path: "spell.id", eq: "vectus" }),
  }),
  Object.freeze({
    id: "spell.orbis",
    type: "spell",
    sourceEvent: "voice.token_detected",
    where: Object.freeze({ path: "token", eq: "orbis" }),
  }),
  Object.freeze({
    id: "gesture.y_spin",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "y" }),
  }),
  Object.freeze({
    id: "orb_state.charged",
    type: "orb_state",
    sourceEvent: "orb.float_grace_grant",
    where: Object.freeze({ path: "ms", gte: 1 }),
  }),
]);

export const SIGNAL_DEFINITIONS_V1_BY_ID = Object.freeze(
  SIGNAL_DEFINITIONS_V1.reduce((acc, def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = def;
    return acc;
  }, {})
);
