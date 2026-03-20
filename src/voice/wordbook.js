import { WORDBOOK_V2_WORDS } from "../content/interactions-v2/wordbook-v2.js";

// Canonical runtime view for wake words.
export const WORDS = Object.freeze(
  (Array.isArray(WORDBOOK_V2_WORDS) ? WORDBOOK_V2_WORDS : []).map((w) => Object.freeze({
    active: w.active !== false,
    id: String(w.id || "").trim().toLowerCase(),
    phrase: String(w.phrase || "").trim().toLowerCase(),
    onnxModel: String(w.onnx || "").trim().toLowerCase(),
    minConfidence: Number.isFinite(Number(w.confidence)) ? Number(w.confidence) : 0.6,
    cooldownMs: Number.isFinite(Number(w.cooldownMs)) ? Number(w.cooldownMs) : 0,
  }))
);

export const WORDS_BY_ID = Object.freeze(
  WORDS.reduce((acc, w) => {
    const id = String(w && w.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = w;
    return acc;
  }, {})
);

export const ACTIVE_WORDS = Object.freeze(
  WORDS.filter((w) => w && w.active !== false)
);

export const ACTIVE_WORDS_BY_ID = Object.freeze(
  ACTIVE_WORDS.reduce((acc, w) => {
    const id = String(w && w.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = w;
    return acc;
  }, {})
);

// Backward-compatible aliases for existing spell-centric imports.
export const SPELLS = WORDS;
export const SPELLS_BY_ID = WORDS_BY_ID;
export const ACTIVE_SPELLS = ACTIVE_WORDS;
export const ACTIVE_SPELLS_BY_ID = ACTIVE_WORDS_BY_ID;
