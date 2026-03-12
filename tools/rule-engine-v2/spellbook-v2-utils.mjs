function toLowerText(v) {
  return String(v || "").trim().toLowerCase();
}

function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function listSpellbookSpells(spellbookV2) {
  return Array.isArray(spellbookV2 && spellbookV2.spells) ? spellbookV2.spells : [];
}

export function listActiveSpellbookSpells(spellbookV2) {
  return listSpellbookSpells(spellbookV2).filter((s) => s && s.active !== false);
}

export function listActiveSpellModelRefs(spellbookV2) {
  return listActiveSpellbookSpells(spellbookV2).map((s) => ({
    id: toLowerText(s.id),
    onnx: toLowerText(s.onnx),
  }));
}

export function listActiveSpellAuthoringRows(spellbookV2) {
  return listActiveSpellbookSpells(spellbookV2).map((s) => ({
    id: toLowerText(s.id),
    phrase: toLowerText(s.phrase),
    onnx: toLowerText(s.onnx),
    confidence: toNumber(s.confidence, 0.6),
    cooldownMs: toNumber(s.cooldownMs, 0),
  }));
}
