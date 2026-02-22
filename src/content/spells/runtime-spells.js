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
    castActionId: "teleport_domus",
  },
  {
    id: "ignis_sanctus",
    school: "ignis",
    classKey: "sanctus",
    slot: "UD",
    intent: "spell.school_shield",
    cooldownMs: 1000,
    castActionId: "shield_sanctus",
  },
  {
    id: "fridgis_sanctus",
    school: "fridgis",
    classKey: "sanctus",
    slot: "UD",
    intent: "spell.school_shield",
    cooldownMs: 1000,
    castActionId: "shield_sanctus",
  },
  {
    id: "electrum_sanctus",
    school: "electrum",
    classKey: "sanctus",
    slot: "UD",
    intent: "spell.school_shield",
    cooldownMs: 1000,
    castActionId: "shield_sanctus",
  },
  {
    id: "ignis_rota",
    school: "ignis",
    classKey: "rota",
    slot: "FB",
    intent: "spell.school_aoe",
    cooldownMs: 1100,
    castActionId: "aoe_flame",
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

