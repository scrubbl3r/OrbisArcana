// v1 runtime spell schema (game-side content)
// Keeps gameplay-facing spell metadata separate from voice recognition config.

export const RUNTIME_SPELLS = Object.freeze([
  {
    id: "domus",
    axisSpell: null,
    wakeWindowSpell: null,
    // Legacy aliases during migration.
    school: null,
    classKey: null,
    slot: "UD",
    intent: "spell.domus",
    cooldownMs: 250,
    castActionId: "domus_teleport",
  },
  {
    id: "sanctum",
    axisSpell: null,
    wakeWindowSpell: "sanctum",
    // Legacy aliases during migration.
    school: null,
    classKey: "sanctum",
    slot: "UD",
    intent: "spell.wake_window_select",
    cooldownMs: 1000,
    castActionId: "sanctum_shield",
  },
  {
    id: "rota",
    axisSpell: null,
    wakeWindowSpell: "rota",
    // Legacy aliases during migration.
    school: null,
    classKey: "rota",
    slot: "FB",
    intent: "spell.wake_window_select",
    cooldownMs: 1100,
    castActionId: "aoe_school",
    postCastActions: [
      { id: "orb_super_grace", payload: { ms: 2500 } },
    ],
  },
  {
    id: "vectus",
    axisSpell: null,
    wakeWindowSpell: "vectus",
    // Legacy aliases during migration.
    school: null,
    classKey: "vectus",
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
