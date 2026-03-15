// V2 wake-word inventory SSOT.
// This file intentionally contains only spell availability/recognition metadata.
// Docs index: docs/rule-engine-v2-docs-index.md

export const SPELLBOOK_V2 = Object.freeze({
  version: "2",
  spells: Object.freeze([
    Object.freeze({ id: "orbis", phrase: "orbis", active: true, onnx: "orbis", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "are_kay_nuh", phrase: "are_kay_nuh", active: true, onnx: "are_kay_nuh", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "ignis", phrase: "ignis", active: true, onnx: "ignis", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "domus", phrase: "domus", active: true, onnx: "domus", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "pyro", phrase: "pyro", active: true, onnx: "pyro", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "fridgis", phrase: "fridgis", active: true, onnx: "fridgis", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "electrum", phrase: "electrum", active: true, onnx: "electrum", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "sanctum", phrase: "sanctum", active: true, onnx: "sanctum", confidence: 0.6, cooldownMs: 0 }),
    Object.freeze({ id: "vectus", phrase: "vectus", active: true, onnx: "vectus", confidence: 0.40, cooldownMs: 0 }),
    Object.freeze({ id: "rota", phrase: "rota", active: true, onnx: "rota", confidence: 0.6, cooldownMs: 0 }),
  ]),
});

export const SPELLBOOK_V2_SPELLS = Object.freeze(
  Array.isArray(SPELLBOOK_V2.spells) ? SPELLBOOK_V2.spells.slice() : []
);

export const SPELLBOOK_V2_SPELLS_BY_ID = Object.freeze(
  SPELLBOOK_V2_SPELLS.reduce((acc, s) => {
    const id = String(s && s.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = s;
    return acc;
  }, {})
);

export const SPELLBOOK_V2_ACTIVE_SPELLS = Object.freeze(
  SPELLBOOK_V2_SPELLS.filter((s) => s && s.active !== false)
);

export const SPELLBOOK_V2_ACTIVE_SPELLS_BY_ID = Object.freeze(
  SPELLBOOK_V2_ACTIVE_SPELLS.reduce((acc, s) => {
    const id = String(s && s.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = s;
    return acc;
  }, {})
);
