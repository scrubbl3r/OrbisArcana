import { VOICE_MODES } from "./voice-config.js";

export const META_COMMANDS = Object.freeze({
  WAKE_TOKEN: "orbis",
});

export const WAKE_TOKEN = META_COMMANDS.WAKE_TOKEN;
export const WAKE_TOKEN_ALIASES = Object.freeze([
  "orbus",
  "orbis",
  "orbisz",
  "orbyss",
  "obis",
  "orbizz",
  "obess",
  "orbess",
]);
export const WAKE_TOKENS = Object.freeze([WAKE_TOKEN, ...WAKE_TOKEN_ALIASES]);

export const SPELLS = [
  {
    id: "domus",
    phrase: "domus",
    aliases: ["dohmus", "domas", "dohmas", "thomas", "dumbass"],
    minConfidence: 0.62,
    cooldownMs: 800,
    gateModes: [VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.domus",
  },
  {
    id: "combustus",
    phrase: "combustus",
    aliases: ["combstus", "kombustus", "combustas"],
    minConfidence: 0.62,
    cooldownMs: 900,
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.fire_burst",
  },
  {
    id: "sanctum",
    phrase: "sanctum",
    aliases: ["sanktum", "sanctam", "sanktum"],
    minConfidence: 0.62,
    cooldownMs: 1000,
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.shield",
  },
  {
    id: "ixiom",
    phrase: "ixiom",
    aliases: ["ixion", "iksiom", "ikseom"],
    minConfidence: 0.64,
    cooldownMs: 850,
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.phase_shift",
  },
  {
    id: "dagrog",
    phrase: "dagrog",
    aliases: ["dagrok", "dagrogue", "dagrokh"],
    minConfidence: 0.64,
    cooldownMs: 850,
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.gravity_warp",
  },
  {
    id: "vulvax",
    phrase: "vulvax",
    aliases: ["vulfax", "vulvaks", "voolvax"],
    minConfidence: 0.66,
    cooldownMs: 950,
    gateModes: [VOICE_MODES.GATED_WINDOW, VOICE_MODES.WAKE_TOKEN_OPEN_WORLD],
    intent: "spell.orb_overdrive",
  },
];

export const SPELLS_BY_ID = Object.freeze(
  SPELLS.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {})
);
