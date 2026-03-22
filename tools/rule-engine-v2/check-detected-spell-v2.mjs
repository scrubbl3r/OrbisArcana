// Back-compat wrappers that delegate spell-detected helpers to canonical word helpers.
// This shim intentionally keeps the old API shape while forwarding to word helpers.
import { emitDetectedWord, emitDetectedWordAt } from "./check-detected-word-v2.mjs";
export function emitDetectedSpell(eventBus, { id, intent, phrase, atMs, confidence }) {
  emitDetectedWord(eventBus, { id, intent, phrase, atMs, confidence });
}

export function emitDetectedSpellAt(eventBus, {
  id,
  intent,
  atMs,
  confidence,
  phrase,
}) {
  emitDetectedWordAt(eventBus, {
    id,
    intent,
    phrase,
    atMs,
    confidence,
  });
}
