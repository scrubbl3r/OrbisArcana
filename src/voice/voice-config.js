export const VOICE_MODES = {
  OFF: "off",
  GATED_WINDOW: "gated_window",
  WAKE_TOKEN_OPEN_WORLD: "wake_token_open_world",
};

export const VOICE_RECOGNITION_CONFIG = {
  lang: "en-US",
  interimResults: false,
  continuous: true,
  maxAlternatives: 3,
};

export const VOICE_MATCH_CONFIG = {
  defaultMinConfidence: 0.62,
  fallbackAliasMinConfidence: 0.68,
  keepUnknownForDebug: true,
};

export const VOICE_GATE_DEFAULTS = {
  windowTimeoutMs: 4000,
  autoStopOnCast: true,
};
