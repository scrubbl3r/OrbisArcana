import { VOICE_MODES } from "./voice-config.js";

export const META_COMMANDS = Object.freeze({
  WAKE_TOKEN: "orbis",
});

export const WAKE_TOKEN = META_COMMANDS.WAKE_TOKEN;
export const WAKE_TOKEN_ALIASES = Object.freeze([]);
export const WAKE_TOKENS = Object.freeze([WAKE_TOKEN]);

export const SPELLS = [
  {
    id: "domus",
    phrase: "domus",
    minConfidence: 0.62,
    cooldownMs: 250,
    allowedAxes: ["y"],
    fixedSlot: "UD",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.domus",
  },
  {
    id: "tempus",
    phrase: "tempus",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["y"],
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.school_select",
    school: "tempus",
  },
  {
    id: "fridgis",
    phrase: "fridgis",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x"],
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.school_select",
    school: "fridgis",
  },
  {
    id: "electrum",
    phrase: "electrum",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["z"],
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.school_select",
    school: "electrum",
  },
  {
    id: "sanctum",
    phrase: "sanctum",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x", "y", "z"],
    fixedSlot: "UD",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.class_select",
    classKey: "sanctum",
  },
  {
    id: "vectus",
    phrase: "vectus",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x", "y", "z"],
    fixedSlot: "LR",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.class_select",
    classKey: "vectus",
  },
  {
    id: "rota",
    phrase: "rota",
    minConfidence: 0.6,
    cooldownMs: 0,
    allowedAxes: ["x", "y", "z"],
    fixedSlot: "FB",
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.class_select",
    classKey: "rota",
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
