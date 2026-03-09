// Runtime routing metadata intentionally separated from recognition spellbook.
// This file owns behavior-oriented spell metadata during refactor slices.

export const WAKE_SPELL_IDS = Object.freeze([
  "rota",
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

export const AXIS_SPELL_IDS = Object.freeze([
  "tempus",
  "fridgis",
  "electrum",
]);

export const WAKE_WINDOW_SPELL_IDS = Object.freeze([
  "rota",
  "sanctum",
  "vectus",
]);

export const WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN = Object.freeze({
  rota: "rota",
  sanctum: "sanctum",
  vectus: "vectus",
});

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

export const KWS_SIM_SPELL_IDS = Object.freeze([
  "tempus",
  "rota",
  "electrum",
  "sanctum",
  "domus",
]);

export const KWS_INFER_DEFAULT_SPELL_ID = "tempus";

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
    intent: "spell.axis_select",
    axisSpell: "tempus",
    allowedAxes: Object.freeze(["y"]),
  }),
  Object.freeze({
    id: "fridgis",
    intent: "spell.axis_select",
    axisSpell: "fridgis",
    allowedAxes: Object.freeze(["x"]),
  }),
  Object.freeze({
    id: "electrum",
    intent: "spell.axis_select",
    axisSpell: "electrum",
    allowedAxes: Object.freeze(["z"]),
  }),
  Object.freeze({
    id: "sanctum",
    intent: "spell.wake_window_select",
    wakeWindowSpell: "sanctum",
    fixedSlot: "UD",
    allowedAxes: Object.freeze(["x", "y", "z"]),
  }),
  Object.freeze({
    id: "vectus",
    intent: "spell.wake_window_select",
    wakeWindowSpell: "vectus",
    fixedSlot: "LR",
    allowedAxes: Object.freeze(["x", "y", "z"]),
  }),
  Object.freeze({
    id: "rota",
    intent: "spell.wake_window_select",
    wakeWindowSpell: "rota",
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
