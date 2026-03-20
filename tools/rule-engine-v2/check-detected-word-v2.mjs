import {
  EVT_VOICE_SPELL_DETECTED,
  EVT_VOICE_WORD_DETECTED,
} from "../../src/contracts/events.js";

export function emitDetectedWord(eventBus, {
  id,
  intent,
  phrase,
  atMs,
  confidence,
  emitLegacySpellDetected = false,
}) {
  const spokenPhrase = typeof phrase === "string"
    ? phrase
    : (typeof id === "string" ? id : "");
  const confidenceNum = Number(confidence);
  const wordPayload = {
    word: { id, intent, phrase: spokenPhrase },
    atMs,
  };
  if (Number.isFinite(confidenceNum)) wordPayload.confidence = confidenceNum;
  eventBus.emit(EVT_VOICE_WORD_DETECTED, wordPayload);
  if (emitLegacySpellDetected) {
    eventBus.emit(EVT_VOICE_SPELL_DETECTED, {
      spell: { ...wordPayload.word },
      atMs: wordPayload.atMs,
      ...(Number.isFinite(confidenceNum) ? { confidence: confidenceNum } : {}),
    });
  }
}

export function emitDetectedWordAt(eventBus, {
  id,
  intent,
  atMs,
  confidence,
  phrase,
  emitLegacySpellDetected = false,
}) {
  const atMsNum = Number(atMs);
  emitDetectedWord(eventBus, {
    id,
    intent,
    phrase,
    atMs: atMsNum,
    confidence,
    emitLegacySpellDetected,
  });
}
