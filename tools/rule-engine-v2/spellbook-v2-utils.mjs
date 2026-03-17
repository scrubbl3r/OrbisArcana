import { asLowerText } from "./text-utils-v2.mjs";

function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function listSpellbookSpells(spellbookV2) {
  return Array.isArray(spellbookV2?.spells) ? spellbookV2.spells : [];
}

export function countSpellbookSpells(spellbookV2) {
  return listSpellbookSpells(spellbookV2).length;
}

export function listActiveSpellbookSpells(spellbookV2) {
  return listSpellbookSpells(spellbookV2).filter((s) => s?.active !== false);
}

export function listActiveSpellModelRefs(spellbookV2) {
  return listActiveSpellbookSpells(spellbookV2).map((s) => ({
    id: asLowerText(s.id),
    onnx: asLowerText(s.onnx),
  }));
}

export function listActiveSpellAuthoringRows(spellbookV2) {
  return listActiveSpellbookSpells(spellbookV2).map((s) => ({
    id: asLowerText(s.id),
    phrase: asLowerText(s.phrase),
    onnx: asLowerText(s.onnx),
    confidence: toNumber(s.confidence, 0.6),
    cooldownMs: toNumber(s.cooldownMs, 0),
  }));
}
