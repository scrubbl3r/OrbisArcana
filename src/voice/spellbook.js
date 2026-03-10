import { SPELLBOOK_V2_SPELLS } from "../content/interactions-v2/spellbook-v2.js";

// Backward-compatible view for existing runtime consumers.
// Authoring SSOT now lives in content/interactions-v2/spellbook-v2.js.
export const SPELLS = Object.freeze(
  (Array.isArray(SPELLBOOK_V2_SPELLS) ? SPELLBOOK_V2_SPELLS : []).map((s) => Object.freeze({
    active: s.active !== false,
    id: String(s.id || "").trim().toLowerCase(),
    phrase: String(s.phrase || "").trim().toLowerCase(),
    onnxModel: String(s.onnx || "").trim().toLowerCase(),
    minConfidence: Number.isFinite(Number(s.confidence)) ? Number(s.confidence) : 0.6,
    cooldownMs: Number.isFinite(Number(s.cooldownMs)) ? Number(s.cooldownMs) : 0,
  }))
);

export const SPELLS_BY_ID = Object.freeze(
  SPELLS.reduce((acc, s) => {
    const id = String(s && s.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = s;
    return acc;
  }, {})
);

export const ACTIVE_SPELLS = Object.freeze(
  SPELLS.filter((s) => s && s.active !== false)
);

export const ACTIVE_SPELLS_BY_ID = Object.freeze(
  ACTIVE_SPELLS.reduce((acc, s) => {
    const id = String(s && s.id || "").toLowerCase();
    if (!id) return acc;
    acc[id] = s;
    return acc;
  }, {})
);
