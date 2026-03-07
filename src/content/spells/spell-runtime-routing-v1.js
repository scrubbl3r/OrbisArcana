// Runtime routing metadata intentionally separated from recognition spellbook.
// This file owns behavior-oriented spell metadata during refactor slices.

export const WAKE_SPELL_IDS = Object.freeze([
  "orbis",
]);

export const WAKE_REQUIRED_SPELL_IDS = Object.freeze([
  "domus",
]);

export const SPELL_WINDOW_BYPASS_SPELL_IDS = Object.freeze([
  "tempus",
  "fridgis",
  "electrum",
  "rota",
  "sanctum",
  "vectus",
]);

export const SCHOOL_SPELL_IDS = Object.freeze([
  "tempus",
  "fridgis",
  "electrum",
]);

export const CLASS_SPELL_IDS = Object.freeze([
  "rota",
  "sanctum",
  "vectus",
]);

export const KWS_FLASH_TOKEN_SPELL_IDS = Object.freeze([
  "orbis",
  "domus",
  "tempus",
  "fridgis",
  "electrum",
]);

export const KWS_ROW_TOP_SPELL_IDS = Object.freeze([
  "orbis",
  "domus",
  "tempus",
  "fridgis",
  "electrum",
]);

export const KWS_ROW_BOTTOM_SPELL_IDS = Object.freeze([
  "rota",
  "sanctum",
  "vectus",
]);

export const SPELL_RUNTIME_ROUTING = Object.freeze([
  Object.freeze({
    id: "orbis",
    intent: "spell.wake",
  }),
  Object.freeze({
    id: "domus",
    intent: "spell.domus",
    allowedAxes: Object.freeze(["y"]),
    fixedSlot: "UD",
    slotByAxis: Object.freeze({ y: "UD" }),
    clearSlotsOnAxis: Object.freeze({ y: Object.freeze(["LR", "FB"]) }),
  }),
  Object.freeze({
    id: "tempus",
    intent: "spell.school_select",
    school: "tempus",
    allowedAxes: Object.freeze(["y"]),
  }),
  Object.freeze({
    id: "fridgis",
    intent: "spell.school_select",
    school: "fridgis",
    allowedAxes: Object.freeze(["x"]),
  }),
  Object.freeze({
    id: "electrum",
    intent: "spell.school_select",
    school: "electrum",
    allowedAxes: Object.freeze(["z"]),
  }),
  Object.freeze({
    id: "sanctum",
    intent: "spell.class_select",
    classKey: "sanctum",
    fixedSlot: "UD",
    allowedAxes: Object.freeze(["x", "y", "z"]),
  }),
  Object.freeze({
    id: "vectus",
    intent: "spell.class_select",
    classKey: "vectus",
    fixedSlot: "LR",
    allowedAxes: Object.freeze(["x", "y", "z"]),
  }),
  Object.freeze({
    id: "rota",
    intent: "spell.class_select",
    classKey: "rota",
    fixedSlot: "FB",
    allowedAxes: Object.freeze(["x", "y", "z"]),
  }),
]);

export const SPELL_RUNTIME_ROUTING_BY_ID = Object.freeze(
  SPELL_RUNTIME_ROUTING.reduce((acc, item) => {
    const id = String(item && item.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, {})
);
