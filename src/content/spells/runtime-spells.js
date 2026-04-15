// RUNTIME SPELL ROUTING LAYER
// This file provides slot/cast routing metadata for gameplay runtime.
// Interaction-chain authoring SSOT lives in:
// - src/content/interactions-v2/interactions-v2.js
// - src/content/interactions-v2/wordbook-v2.js
// Keeps gameplay-facing spell metadata separate from voice recognition config.

export const RUNTIME_WORDS = Object.freeze([
  {
    id: "domus",
    slot: "UD",
    intent: "spell.domus",
    cooldownMs: 250,
    castActionId: "teleport",
  },
  {
    id: "sanctum",
    slot: "UD",
    intent: "spell.sanctum",
    cooldownMs: 1000,
    castActionId: "bubble_shield",
  },
  {
    id: "rota",
    slot: "FB",
    intent: "spell.rota",
    cooldownMs: 1100,
    castActionId: "aoe_flame",
  },
  {
    id: "azerith",
    slot: "LR",
    intent: "spell.azerith",
    cooldownMs: 900,
    castActionId: "bubble_shield",
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
