import { VOICE_MODES } from "../voice/voice-config.js";

export function createVoiceState(config = {}) {
  return {
    mode: Object.values(VOICE_MODES).includes(config.mode) ? config.mode : VOICE_MODES.OFF,
    gateOpen: !!config.gateOpen,
    lastSpellId: config.lastSpellId || "",
    lastRejectReason: config.lastRejectReason || "",
    lastError: config.lastError || "",

    lastEventAtMs: Number(config.lastEventAtMs) || 0,
  };
}
