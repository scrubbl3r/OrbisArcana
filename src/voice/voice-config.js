export const VOICE_MODES = {
  OFF: "off",
  GATED_WINDOW: "gated_window",
  WAKE_TOKEN_OPEN_WORLD: "wake_token_open_world",
};

export const KWS_LISTEN_POLICY_MODES = Object.freeze({
  STRICT_A: "A",
  COMPAT_B: "B",
});

export const DEFAULT_KWS_LISTEN_POLICY_MODE = KWS_LISTEN_POLICY_MODES.STRICT_A;
