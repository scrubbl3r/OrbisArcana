import { EVT_VOICE_SPELL_DETECTED } from "../../src/contracts/events.js";

export function emitDetectedSpell(eventBus, { id, intent, phrase, atMs, confidence }) {
  const spokenPhrase = typeof phrase === "string"
    ? phrase
    : (typeof id === "string" ? id : "");
  const confidenceNum = Number(confidence);
  const payload = {
    spell: { id, intent, phrase: spokenPhrase },
    atMs,
  };
  if (Number.isFinite(confidenceNum)) payload.confidence = confidenceNum;
  eventBus.emit(EVT_VOICE_SPELL_DETECTED, payload);
}

export function emitDetectedSpellAt(eventBus, {
  id,
  intent,
  atMs,
  confidence,
  phrase,
}) {
  const atMsNum = Number(atMs);
  emitDetectedSpell(eventBus, {
    id,
    intent,
    phrase,
    atMs: atMsNum,
    confidence,
  });
}
