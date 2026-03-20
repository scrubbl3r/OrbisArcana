// RUNTIME SPELL ROUTING LAYER
// This file provides slot/cast routing metadata for gameplay runtime.
// Interaction-chain authoring SSOT lives in:
// - src/content/interactions-v2/interactions-v2.js
// - src/content/interactions-v2/wordbook-v2.js
//   - compatibility alias: src/content/interactions-v2/spellbook-v2.js
// Keeps gameplay-facing spell metadata separate from voice recognition config.

export const RUNTIME_SPELLS = Object.freeze([
  {
    id: "domus",
    axisSpell: null,
    wakeWindowSpell: null,
    slot: "UD",
    intent: "spell.domus",
    cooldownMs: 250,
    castActionId: "domus_teleport",
  },
  {
    id: "sanctum",
    axisSpell: null,
    wakeWindowSpell: "sanctum",
    slot: "UD",
    intent: "spell.wake_window_select",
    cooldownMs: 1000,
    castActionId: "sanctum_shield",
  },
  {
    id: "rota",
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
    axisSpell: null,
    wakeWindowSpell: "vectus",
    slot: "LR",
    intent: "spell.wake_window_select",
    cooldownMs: 900,
    castActionId: "aoe_electric",
  },
]);

export const RUNTIME_SPELLS_BY_ID = Object.freeze(
  RUNTIME_SPELLS.reduce((acc, spell) => {
    acc[String(spell.id || "")] = Object.freeze({ ...spell });
    return acc;
  }, {})
);

export function getRuntimeSpellById(spellId) {
  return RUNTIME_SPELLS_BY_ID[String(spellId || "").toLowerCase()] || null;
}
