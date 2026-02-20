import { VOICE_MATCH_CONFIG, VOICE_MODES } from "./voice-config.js";
import { normalizeTranscript, stripWakeTokenPrefix } from "./normalizer.js";
import { SPELLS, WAKE_TOKEN, WAKE_TOKENS } from "./spellbook.js";

function buildSpellIndex(spells) {
  const aliasToSpell = new Map();
  for (const spell of spells) {
    const all = [spell.phrase].concat(Array.isArray(spell.aliases) ? spell.aliases : []);
    for (const token of all) {
      const n = normalizeTranscript(token);
      if (!n) continue;
      aliasToSpell.set(n, spell);
    }
  }
  return aliasToSpell;
}

function pickSpellThreshold(spell) {
  const n = Number(spell && spell.minConfidence);
  if (!Number.isFinite(n)) return VOICE_MATCH_CONFIG.defaultMinConfidence;
  return n;
}

function withinGateMode(spell, mode) {
  if (!spell || !Array.isArray(spell.gateModes) || spell.gateModes.length === 0) return true;
  return spell.gateModes.includes(mode);
}

export function matchSpellFromTranscript({
  transcript,
  alternatives = [],
  confidence = 1,
  mode = VOICE_MODES.GATED_WINDOW,
  wakeToken = WAKE_TOKEN,
  wakeTokenAliases = WAKE_TOKENS,
  spells = SPELLS,
} = {}) {
  const aliasToSpell = buildSpellIndex(spells);
  const candidateInputs = [transcript].concat(Array.isArray(alternatives) ? alternatives : []);

  for (const raw of candidateInputs) {
    let normalized = normalizeTranscript(raw);
    if (!normalized) continue;

    if (mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) {
      const wakeCandidates = Array.isArray(wakeTokenAliases) && wakeTokenAliases.length
        ? wakeTokenAliases
        : [wakeToken];

      let wakeMatch = { hasWake: false, rest: normalized };
      for (const w of wakeCandidates) {
        const attempt = stripWakeTokenPrefix(normalized, w);
        if (attempt.hasWake) {
          wakeMatch = attempt;
          break;
        }
      }
      if (!wakeMatch.hasWake) continue;
      normalized = wakeMatch.rest;
      if (!normalized) continue;
    }

    // Closed vocabulary: entire recognized phrase must match one spell alias exactly.
    const spell = aliasToSpell.get(normalized);
    if (!spell) continue;
    if (!withinGateMode(spell, mode)) continue;

    const minConfidence = pickSpellThreshold(spell);
    const conf = Number.isFinite(Number(confidence)) ? Number(confidence) : 1;
    if (conf < minConfidence) {
      return {
        matched: false,
        reason: "below_confidence",
        transcript: normalized,
        confidence: conf,
        minConfidence,
      };
    }

    return {
      matched: true,
      transcript: normalized,
      confidence: conf,
      spell: {
        id: spell.id,
        intent: spell.intent,
        cooldownMs: Number(spell.cooldownMs) || 0,
        phrase: spell.phrase,
        allowedAxes: Array.isArray(spell.allowedAxes) ? spell.allowedAxes.slice() : [],
        fixedSlot: String(spell.fixedSlot || "").toUpperCase(),
        school: String(spell.school || "").toLowerCase(),
        classKey: String(spell.classKey || "").toLowerCase(),
      },
    };
  }

  if (mode === VOICE_MODES.WAKE_TOKEN_OPEN_WORLD) {
    return { matched: false, reason: "no_wake_or_spell_match" };
  }
  return { matched: false, reason: "no_spell_match" };
}
