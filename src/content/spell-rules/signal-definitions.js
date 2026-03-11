// Data-only signal catalog for rule-engine scaffolding.
// Runtime cutover will consume these IDs in a later slice.
import { ACTIVE_SPELLS_BY_ID } from "../../voice/spellbook.js";
import {
  RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS,
  WAKE_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WINDOW_WORD_IDS,
} from "../spells/spell-runtime-routing.js";

function buildWakeWindowSpellSignals() {
  return (Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : [])
    .map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((spellId) => Object.freeze({
      id: `spell.${spellId}`,
      type: "spell",
      sourceEvent: "voice.spell_detected",
      where: Object.freeze({ path: "spell.id", eq: spellId }),
    }));
}

function buildWakeSpellSignals() {
  return (Array.isArray(WAKE_WORD_IDS) ? WAKE_WORD_IDS : [])
    .map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((spellId) => {
      const active = ACTIVE_SPELLS_BY_ID[spellId] || null;
      const phrase = String((active && (active.phrase || active.id)) || spellId).trim().toLowerCase();
      return Object.freeze({
        id: `spell.${spellId}`,
        type: "spell",
        sourceEvent: "voice.token_detected",
        where: Object.freeze({ path: "token", eq: phrase }),
      });
    });
}

function buildWakeRequiredSpellSignals() {
  return (Array.isArray(WAKE_REQUIRED_WORD_IDS) ? WAKE_REQUIRED_WORD_IDS : [])
    .map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase())
    .filter(Boolean)
    .map((spellId) => Object.freeze({
      id: `spell.${spellId}`,
      type: "spell",
      sourceEvent: "voice.spell_detected",
      where: Object.freeze({ path: "spell.id", eq: spellId }),
    }));
}

function buildRuleEngineOwnedImmediateSpellSignals() {
  const excluded = new Set([
    ...(Array.isArray(WAKE_WINDOW_WORD_IDS) ? WAKE_WINDOW_WORD_IDS : []),
    ...(Array.isArray(WAKE_WORD_IDS) ? WAKE_WORD_IDS : []),
    ...(Array.isArray(WAKE_REQUIRED_WORD_IDS) ? WAKE_REQUIRED_WORD_IDS : []),
  ].map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase()).filter(Boolean));
  return (Array.isArray(RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS) ? RULE_ENGINE_OWNED_IMMEDIATE_WORD_IDS : [])
    .map((spellIdRaw) => String(spellIdRaw || "").trim().toLowerCase())
    .filter((spellId) => !!spellId && !excluded.has(spellId))
    .map((spellId) => Object.freeze({
      id: `spell.${spellId}`,
      type: "spell",
      sourceEvent: "voice.spell_detected",
      where: Object.freeze({ path: "spell.id", eq: spellId }),
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

const GENERATED_SPELL_SIGNALS = Object.freeze([
  ...buildWakeWindowSpellSignals(),
  ...buildWakeSpellSignals(),
  ...buildWakeRequiredSpellSignals(),
  ...buildRuleEngineOwnedImmediateSpellSignals(),
]);

export const SIGNAL_DEFINITION_COLLISIONS = Object.freeze(
  buildDuplicateSignalIds(GENERATED_SPELL_SIGNALS)
);

export const SIGNAL_DEFINITIONS = Object.freeze([
  ...dedupeSignalsById(GENERATED_SPELL_SIGNALS),
  Object.freeze({
    id: "gesture.y_spin",
    type: "gesture",
    sourceEvent: "spell_window.flat_spin_opened",
    where: Object.freeze({ path: "axis", eq: "y" }),
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
