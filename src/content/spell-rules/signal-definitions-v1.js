// Data-only signal catalog for Rule Engine v1 scaffolding.
// Runtime cutover will consume these IDs in a later slice.
import { ACTIVE_SPELLS_BY_ID } from "../../voice/spellbook.js";
import { WAKE_SPELL_IDS, WAKE_WINDOW_SPELL_IDS } from "../spells/spell-runtime-routing-v1.js";

function buildWakeWindowSpellSignals() {
  return (Array.isArray(WAKE_WINDOW_SPELL_IDS) ? WAKE_WINDOW_SPELL_IDS : [])
    .map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((spellId) => Object.freeze({
      id: `spell.${spellId}`,
      type: "spell",
      sourceEvent: "voice.spell_detected",
      where: Object.freeze({ path: "spell.id", eq: spellId }),
    }));
}

function buildWakeSpellSignals() {
  return (Array.isArray(WAKE_SPELL_IDS) ? WAKE_SPELL_IDS : [])
    .map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((spellId) => {
      const active = ACTIVE_SPELLS_BY_ID[spellId] || null;
      const phrase = String((active && (active.phrase || active.id)) || spellId).trim().toLowerCase();
      return Object.freeze({
        id: `spell.${spellId}`,
        type: "spell",
        sourceEvent: "voice.token_detected",
        where: Object.freeze({ path: "token", eq: phrase }),
      });
    });
}

export const SIGNAL_DEFINITIONS_V1 = Object.freeze([
  ...buildWakeWindowSpellSignals(),
  ...buildWakeSpellSignals(),
  Object.freeze({
    id: "gesture.y_spin",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "y" }),
  }),
  Object.freeze({
    id: "gesture.fspin_x",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "x" }),
  }),
  Object.freeze({
    id: "gesture.fspin_y",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "y" }),
  }),
  Object.freeze({
    id: "gesture.fspin_z",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "z" }),
  }),
  Object.freeze({
    id: "gesture.ud_shake",
    type: "gesture",
    sourceEvent: "input.shake_triggered",
    where: Object.freeze({ path: "group", eq: "UD" }),
  }),
  Object.freeze({
    id: "gesture.lr_shake",
    type: "gesture",
    sourceEvent: "input.shake_triggered",
    where: Object.freeze({ path: "group", eq: "LR" }),
  }),
  Object.freeze({
    id: "gesture.fb_shake",
    type: "gesture",
    sourceEvent: "input.shake_triggered",
    where: Object.freeze({ path: "group", eq: "FB" }),
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
