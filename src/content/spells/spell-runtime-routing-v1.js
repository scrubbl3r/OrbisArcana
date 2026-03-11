// Runtime routing metadata intentionally separated from recognition spellbook.
// This file owns behavior-oriented spell metadata during refactor slices.
import { collectImmediateEventSpellIdsFromInteractionsV2 } from "../interactions-v2/interactions-v2.js";

export const WAKE_SPELL_IDS = Object.freeze([
  "orbis",
]);

export const WAKE_REQUIRED_SPELL_IDS = Object.freeze([
  "domus",
]);

export const AXIS_SPELL_IDS = Object.freeze([
  "pyro",
  "fridgis",
  "electrum",
]);

export const WAKE_WINDOW_SPELL_IDS = Object.freeze([
  "rota",
  "sanctum",
  "vectus",
]);

// Neutral aliases for gradual de-versioning in runtime consumers.
export const WAKE_WORD_IDS = WAKE_SPELL_IDS;
export const WAKE_REQUIRED_WORD_IDS = WAKE_REQUIRED_SPELL_IDS;
export const AXIS_WORD_IDS = AXIS_SPELL_IDS;
export const WAKE_WINDOW_WORD_IDS = WAKE_WINDOW_SPELL_IDS;

export const SPELL_WINDOW_BYPASS_SPELL_IDS = Object.freeze([
  ...new Set([...AXIS_SPELL_IDS, ...WAKE_WINDOW_SPELL_IDS]),
]);

export const SPELL_WINDOW_BYPASS_WORD_IDS = SPELL_WINDOW_BYPASS_SPELL_IDS;

// Immediate voice spells that are owned by the rule engine path.
// Spell dispatch should not emit duplicate EVT_VOICE_SPELL_CAST for these when rule engine is active.
export const RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS = collectImmediateEventSpellIdsFromInteractionsV2();

export const RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS = RULE_ENGINE_OWNED_IMMEDIATE_SPELL_IDS;

export const WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN = Object.freeze({
  ...WAKE_WINDOW_SPELL_IDS.reduce((acc, id) => {
    const token = String(id || "").trim().toLowerCase();
    if (!token) return acc;
    acc[token] = token;
    return acc;
  }, {}),
});

export const WAKE_WINDOW_RUNTIME_KEY_BY_WORD = WAKE_WINDOW_RUNTIME_KEY_BY_TOKEN;

const KWS_TOP_SPELL_IDS = Object.freeze([
  ...new Set([
    ...WAKE_SPELL_IDS,
    ...WAKE_REQUIRED_SPELL_IDS,
    ...AXIS_SPELL_IDS,
  ].map((id) => String(id || "").trim().toLowerCase()).filter(Boolean)),
]);

export const KWS_FLASH_TOKEN_SPELL_IDS = KWS_TOP_SPELL_IDS;
export const KWS_FLASH_TOKEN_WORD_IDS = KWS_FLASH_TOKEN_SPELL_IDS;

export const KWS_ROW_TOP_SPELL_IDS = KWS_TOP_SPELL_IDS;
export const KWS_ROW_TOP_WORD_IDS = KWS_ROW_TOP_SPELL_IDS;

export const KWS_ROW_BOTTOM_SPELL_IDS = WAKE_WINDOW_SPELL_IDS;
export const KWS_ROW_BOTTOM_WORD_IDS = KWS_ROW_BOTTOM_SPELL_IDS;

export const KWS_SIM_SPELL_IDS = Object.freeze([
  "pyro",
  "rota",
  "electrum",
  "sanctum",
  "domus",
]);
export const KWS_SIM_WORD_IDS = KWS_SIM_SPELL_IDS;

export const KWS_INFER_DEFAULT_SPELL_ID = "pyro";
export const KWS_INFER_DEFAULT_WORD_ID = KWS_INFER_DEFAULT_SPELL_ID;

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
    id: "pyro",
    intent: "spell.axis_select",
    axisSpell: "pyro",
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
export const SPELL_RUNTIME_ROUTING_TABLE = SPELL_RUNTIME_ROUTING;

export const SPELL_RUNTIME_ROUTING_BY_ID = Object.freeze(
  SPELL_RUNTIME_ROUTING.reduce((acc, item) => {
    const id = String(item && item.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = item;
    return acc;
  }, {})
);
export const SPELL_RUNTIME_ROUTING_BY_WORD_ID = SPELL_RUNTIME_ROUTING_BY_ID;
