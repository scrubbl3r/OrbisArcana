import { EVT_VOICE_SPELL_DETECTED } from "../../src/contracts/events.js";

export function emitDetectedSpell(eventBus, { id, intent, phrase, atMs, confidence }) {
  const payload = {
    spell: { id, intent, phrase },
    atMs,
  };
  if (Number.isFinite(Number(confidence))) payload.confidence = Number(confidence);
  eventBus.emit(EVT_VOICE_SPELL_DETECTED, payload);
}
