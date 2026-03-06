import { VOICE_MODES } from "./voice-config.js";

export const SPELLS = [
  {
    active: false,
    id: "orbis",
    phrase: "orbis",
    minConfidence: 0.6,
    cooldownMs: 0,
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.wake",
    roles: ["wake"],
  },
  {
    active: true,
    id: "domus",
    phrase: "domus",
    minConfidence: 0.62,
    cooldownMs: 250,
    allowedAxes: ["y"],
    fixedSlot: "UD",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.domus",
    roles: ["cast"],
  },
  {
    active: true,
    id: "tempus",
    phrase: "tempus",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["y"],
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.school_select",
    school: "tempus",
    roles: ["cast"],
  },
  {
    active: true,
    id: "fridgis",
    phrase: "fridgis",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x"],
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.school_select",
    school: "fridgis",
    roles: ["cast"],
  },
  {
    active: true,
    id: "electrum",
    phrase: "electrum",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["z"],
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.school_select",
    school: "electrum",
    roles: ["cast"],
  },
  {
    active: true,
    id: "sanctum",
    phrase: "sanctum",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x", "y", "z"],
    fixedSlot: "UD",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.class_select",
    classKey: "sanctum",
    roles: ["cast"],
  },
  {
    active: true,
    id: "vectus",
    phrase: "vectus",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x", "y", "z"],
    fixedSlot: "LR",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.class_select",
    classKey: "vectus",
    roles: ["cast"],
  },
  {
    active: true,
    id: "rota",
    phrase: "rota",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x", "y", "z"],
    fixedSlot: "FB",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.class_select",
    classKey: "rota",
    roles: ["cast"],
  },
];

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

function hasRole(spell, role) {
  const want = String(role || "").trim().toLowerCase();
  if (!want) return false;
  const roles = Array.isArray(spell && spell.roles) ? spell.roles : [];
  return roles.some((r) => String(r || "").trim().toLowerCase() === want);
}

export const WAKE_SPELLS = Object.freeze(
  ACTIVE_SPELLS.filter((s) => hasRole(s, "wake"))
);

export const WAKE_TOKENS = Object.freeze(
  WAKE_SPELLS.map((s) => String(s && s.phrase || s && s.id || "").trim().toLowerCase()).filter(Boolean)
);
