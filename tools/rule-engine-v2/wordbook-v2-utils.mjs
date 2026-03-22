// Shared wordbook listing/count/model/authoring-row helpers (+ legacy spellbook aliases).
import { asLowerText } from "./text-utils-v2.mjs";
function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function listWordbookWords(wordbookV2) {
  return Array.isArray(wordbookV2?.spells) ? wordbookV2.spells : [];
}

export function countWordbookWords(wordbookV2) {
  return listWordbookWords(wordbookV2).length;
}

export function listActiveWordbookWords(wordbookV2) {
  return listWordbookWords(wordbookV2).filter((w) => w?.active !== false);
}

export function listActiveWordModelRefs(wordbookV2) {
  return listActiveWordbookWords(wordbookV2).map((w) => ({
    id: asLowerText(w.id),
    onnx: asLowerText(w.onnx),
  }));
}

export function listActiveWordAuthoringRows(wordbookV2) {
  return listActiveWordbookWords(wordbookV2).map((w) => ({
    id: asLowerText(w.id),
    phrase: asLowerText(w.phrase),
    onnx: asLowerText(w.onnx),
    confidence: toNumber(w.confidence, 0.6),
    cooldownMs: toNumber(w.cooldownMs, 0),
  }));
}

// Backward-compatible alias exports.
export const listSpellbookSpells = listWordbookWords;
export const countSpellbookSpells = countWordbookWords;
export const listActiveSpellbookSpells = listActiveWordbookWords;
export const listActiveSpellModelRefs = listActiveWordModelRefs;
export const listActiveSpellAuthoringRows = listActiveWordAuthoringRows;
