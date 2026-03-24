// RUNTIME SPELL ROUTING LAYER
// This file provides slot/cast routing metadata for gameplay runtime.
// Interaction-chain authoring SSOT lives in:
// - src/content/interactions-v2/interactions-v2.js
// - src/content/interactions-v2/wordbook-v2.js
// Keeps gameplay-facing spell metadata separate from voice recognition config.

export const RUNTIME_WORDS = Object.freeze([
  {
    id: "domus",
    axisWord: null,
    axisSpell: null,
    wakeWindowSpell: null,
    slot: "UD",
    intent: "spell.domus",
    cooldownMs: 250,
    castActionId: "domus_teleport",
  },
  {
    id: "sanctum",
    axisWord: null,
    axisSpell: null,
    wakeWindowSpell: "sanctum",
    slot: "UD",
    intent: "spell.wake_window_select",
    cooldownMs: 1000,
    castActionId: "sanctum_shield",
  },
  {
    id: "rota",
    axisWord: null,
    axisSpell: null,
    wakeWindowSpell: "rota",
    slot: "FB",
    intent: "spell.wake_window_select",
    cooldownMs: 1100,
    castActionId: "aoe_axis",
    postCastActions: [
      { id: "orb_super_grace", payload: { ms: 2500 } },
    ],
  },
  {
    id: "vectus",
    axisWord: null,
    axisSpell: null,
    wakeWindowSpell: "vectus",
    slot: "LR",
    intent: "spell.wake_window_select",
    cooldownMs: 900,
    castActionId: "aoe_electric",
  },
]);

export const RUNTIME_WORDS_BY_ID = Object.freeze(
  RUNTIME_WORDS.reduce((acc, spell) => {
    acc[String(spell.id || "")] = Object.freeze({ ...spell });
    return acc;
  }, {})
);

export function getRuntimeWordById(wordId) {
  return RUNTIME_WORDS_BY_ID[String(wordId || "").toLowerCase()] || null;
}
