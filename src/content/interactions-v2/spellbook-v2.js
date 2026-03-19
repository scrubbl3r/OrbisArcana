// V2 wake-word inventory SSOT.
// This file intentionally contains only spell availability/recognition metadata.
// Docs index: docs/rule-engine-v2-docs-index.md

const SPELLBOOK_V2_VERSION = "2";
const FIELD_VERSION = "version";
const FIELD_SPELLS = "spells";
const FIELD_ID = "id";
const FIELD_PHRASE = "phrase";
const FIELD_ONNX = "onnx";
const FIELD_ACTIVE = "active";
const FIELD_CONFIDENCE = "confidence";
const FIELD_COOLDOWN_MS = "cooldownMs";
const DEFAULT_CONFIDENCE = 0.6;
const DEFAULT_COOLDOWN_MS = 0;

function makeSpell({
  id,
  phrase = id,
  active = true,
  onnx = id,
  confidence = DEFAULT_CONFIDENCE,
  cooldownMs = DEFAULT_COOLDOWN_MS,
}) {
  return Object.freeze({
    [FIELD_ID]: id,
    [FIELD_PHRASE]: phrase,
    [FIELD_ACTIVE]: active,
    [FIELD_ONNX]: onnx,
    [FIELD_CONFIDENCE]: confidence,
    [FIELD_COOLDOWN_MS]: cooldownMs,
  });
}

export const SPELLBOOK_V2 = Object.freeze({
  [FIELD_VERSION]: SPELLBOOK_V2_VERSION,
  [FIELD_SPELLS]: Object.freeze([
    makeSpell({ id: "orbis" }),
    makeSpell({ id: "arcana" }),
    makeSpell({ id: "are_kay_nah", phrase: "are kay nah" }),
    makeSpell({ id: "domus" }),
    makeSpell({ id: "pyro" }),
    makeSpell({ id: "fridgis" }),
    makeSpell({ id: "electrum" }),
    makeSpell({ id: "sanctum" }),
    makeSpell({ id: "vectus", confidence: 0.4 }),
    makeSpell({ id: "rota" }),
  ]),
});

export const SPELLBOOK_V2_SPELLS = Object.freeze(
  Array.isArray(SPELLBOOK_V2[FIELD_SPELLS]) ? SPELLBOOK_V2[FIELD_SPELLS].slice() : []
);

function asSpellId(spell) {
  return typeof spell?.[FIELD_ID] === "string" ? spell[FIELD_ID].trim().toLowerCase() : "";
}

function buildSpellsById(spells) {
  return Object.freeze(
    spells.reduce((acc, spell) => {
      const id = asSpellId(spell);
      if (!id) return acc;
      acc[id] = spell;
      return acc;
    }, {})
  );
}

export const SPELLBOOK_V2_SPELLS_BY_ID = Object.freeze(
  buildSpellsById(SPELLBOOK_V2_SPELLS)
);

export const SPELLBOOK_V2_ACTIVE_SPELLS = Object.freeze(
  SPELLBOOK_V2_SPELLS.filter((s) => s?.[FIELD_ACTIVE] !== false)
);

export const SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID = Object.freeze(
  buildSpellsById(SPELLBOOK_V2_ACTIVE_SPELLS)
);
