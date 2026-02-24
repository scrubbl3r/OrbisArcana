// v1 runtime spell schema (game-side content)
// Keeps gameplay-facing spell metadata separate from voice recognition config.

export const RUNTIME_SPELLS = Object.freeze([
  {
    id: "domus",
    school: null,
    classKey: null,
    slot: "UD",
    intent: "spell.domus",
    cooldownMs: 800,
    castActionId: "domus_teleport",
  },
  {
    id: "ignis_sanctum",
    school: "ignis",
    classKey: "sanctum",
    slot: "UD",
    intent: "spell.school_shield",
    cooldownMs: 1000,
    castActionId: "sanctum_shield",
  },
  {
    id: "fridgis_sanctum",
    school: "fridgis",
    classKey: "sanctum",
    slot: "UD",
    intent: "spell.school_shield",
    cooldownMs: 1000,
    castActionId: "sanctum_shield",
  },
  {
    id: "electrum_sanctum",
    school: "electrum",
    classKey: "sanctum",
    slot: "UD",
    intent: "spell.school_shield",
    cooldownMs: 1000,
    castActionId: "sanctum_shield",
  },
  {
    id: "ignis_rota",
    school: "ignis",
    classKey: "rota",
    slot: "FB",
    intent: "spell.school_aoe",
    cooldownMs: 1100,
    castActionId: "aoe_flame",
    postCastActionIds: ["orb_super_grace"],
  },
  {
    id: "fridgis_rota",
    school: "fridgis",
    classKey: "rota",
    slot: "FB",
    intent: "spell.school_aoe",
    cooldownMs: 1100,
    castActionId: "aoe_frost",
  },
  {
    id: "electrum_rota",
    school: "electrum",
    classKey: "rota",
    slot: "FB",
    intent: "spell.school_aoe",
    cooldownMs: 1100,
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
