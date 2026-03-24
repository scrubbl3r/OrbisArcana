// Data-only signal catalog for rule-engine scaffolding.
// Runtime cutover will consume these IDs in a later slice.
import { ACTIVE_WORDS_BY_ID } from "../../voice/wordbook.js";
import {
  RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS,
  WAKE_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WINDOW_WORD_IDS,
} from "../spells/spell-runtime-routing.js";

function buildWakeWindowWordSignals() {
  const wakeWordIds = new Set(
    (Array.isArray(WAKE_WORD_IDS) ? WAKE_WORD_IDS : [])
      .map((wordIdRaw) => String(wordIdRaw || "").trim().toLowerCase())
      .filter(Boolean)
  );
  return (Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : [])
    .map((wordIdRaw) => String(wordIdRaw || "").trim().toLowerCase())
    // Wake words must be token-driven; do not shadow them with word-detected wake-window signals.
    .filter((wordId) => !wakeWordIds.has(wordId))
    .filter(Boolean)
    .map((wordId) => Object.freeze({
      // Runtime signal namespace remains spell.* for compatibility.
      id: `spell.${wordId}`,
      type: "spell",
      sourceEvent: "voice.word_detected",
      where: Object.freeze({ path: "word.id", eq: wordId }),
    }));
}

function buildWakeWordSignals() {
  return (Array.isArray(WAKE_WORD_IDS) ? WAKE_WORD_IDS : [])
    .map((wordIdRaw) => String(wordIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((wordId) => {
      const active = ACTIVE_WORDS_BY_ID[wordId] || null;
      const phrase = String((active && (active.phrase || active.id)) || wordId).trim().toLowerCase();
      return Object.freeze({
        id: `spell.${wordId}`,
        type: "spell",
        sourceEvent: "voice.token_detected",
        where: Object.freeze({ path: "token", eq: phrase }),
      });
    });
}

function buildWakeRequiredWordSignals() {
  return (Array.isArray(WAKE_REQUIRED_WORD_IDS) ? WAKE_REQUIRED_WORD_IDS : [])
    .map((wordIdRaw) => String(wordIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((wordId) => Object.freeze({
      id: `spell.${wordId}`,
      type: "spell",
      sourceEvent: "voice.word_detected",
      where: Object.freeze({ path: "word.id", eq: wordId }),
    }));
}

function buildRuleEngineOwnedImmediateWordSignals() {
  const excluded = new Set([
    ...(Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : []),
    ...(Array.isArray(WAKE_WORD_IDS) ? WAKE_WORD_IDS : []),
    ...(Array.isArray(WAKE_REQUIRED_WORD_IDS) ? WAKE_REQUIRED_WORD_IDS : []),
  ].map((wordIdRaw) => String(wordIdRaw || "").trim().toLowerCase()).filter(Boolean));
  return (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : [])
    .map((wordIdRaw) => String(wordIdRaw || "").trim().toLowerCase())
    .filter((wordId) => !!wordId && !excluded.has(wordId))
    .map((wordId) => Object.freeze({
      id: `spell.${wordId}`,
      type: "spell",
      sourceEvent: "voice.word_detected",
      where: Object.freeze({ path: "word.id", eq: wordId }),
    }));
}

function dedupeSignalsById(defs = []) {
  const seen = new Set();
  const out = [];
  for (const def of (Array.isArray(defs) ? defs : [])) {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(def);
  }
  return out;
}

function buildDuplicateSignalIds(defs = []) {
  const seen = new Set();
  const dups = new Set();
  for (const def of (Array.isArray(defs) ? defs : [])) {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) continue;
    if (seen.has(id)) dups.add(id);
    else seen.add(id);
  }
  return Array.from(dups).sort();
}

const GENERATED_WORD_SIGNALS = Object.freeze([
  ...buildWakeWindowWordSignals(),
  ...buildWakeWordSignals(),
  ...buildWakeRequiredWordSignals(),
  ...buildRuleEngineOwnedImmediateWordSignals(),
]);

export const SIGNAL_DEFINITION_COLLISIONS = Object.freeze(
  buildDuplicateSignalIds(GENERATED_WORD_SIGNALS)
);

export const SIGNAL_DEFINITIONS = Object.freeze([
  ...dedupeSignalsById(GENERATED_WORD_SIGNALS),
  Object.freeze({
    id: "gesture.spin_x",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "x" }),
  }),
  Object.freeze({
    id: "gesture.spin_y",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "y" }),
  }),
  Object.freeze({
    id: "gesture.spin_z",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "z" }),
  }),
  Object.freeze({
    id: "gesture.shake_ud",
    type: "gesture",
    sourceEvent: "input.shake_triggered",
    where: Object.freeze({ path: "group", eq: "UD" }),
  }),
  Object.freeze({
    id: "gesture.shake_lr",
    type: "gesture",
    sourceEvent: "input.shake_triggered",
    where: Object.freeze({ path: "group", eq: "LR" }),
  }),
  Object.freeze({
    id: "gesture.shake_fb",
    type: "gesture",
    sourceEvent: "input.shake_triggered",
    where: Object.freeze({ path: "group", eq: "FB" }),
  }),
  Object.freeze({
    id: "orb_state.charged",
    type: "orb_state",
    sourceEvent: "orb.float_grace_grant",
    where: Object.freeze({ path: "ms", gte: 1 }),
  }),
]);

export const SIGNAL_DEFINITIONS_BY_ID = Object.freeze(
  SIGNAL_DEFINITIONS.reduce((acc, def) => {
    const id = String(def && def.id || "").trim().toLowerCase();
    if (!id) return acc;
    acc[id] = def;
    return acc;
  }, {})
);
