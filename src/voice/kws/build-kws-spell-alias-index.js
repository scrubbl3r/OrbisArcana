import { SPELLS } from "../spellbook.js";
import { normalizeTranscript } from "../normalizer.js";

/**
 * @typedef {Object} KwsAliasEntry
 * @property {string} spellId
 * @property {string} alias
 * @property {string[]} tokens
 * @property {number} minConfidence
 */

function tokenizeAliasText(text) {
  const normalized = normalizeTranscript(text);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

/**
 * Builds a tokenized alias index from the canonical spellbook so KWS parsing
 * shares the same source of truth as the current STT matcher.
 *
 * @param {Array<Object>} [spells]
 * @returns {{ byTokenCount: Map<number, KwsAliasEntry[]>, all: KwsAliasEntry[] }}
 */
export function buildKwsSpellAliasIndex(spells = SPELLS) {
  const byTokenCount = new Map();
  const all = [];
  const seen = new Set();
  const EXCLUDED_KWS_INTENTS = new Set([
    "spell.school_shield",
    "spell.school_ray",
    "spell.school_aoe",
  ]);

  for (const spell of Array.isArray(spells) ? spells : []) {
    if (!spell || !spell.id) continue;
    const intent = String(spell.intent || "").trim().toLowerCase();
    // KWS should match atomic tokens (school/class/wake) and let dispatch resolve
    // school+class combinations. This avoids noisy duplicate compound matches.
    if (EXCLUDED_KWS_INTENTS.has(intent)) continue;
    const minConfidence = Number.isFinite(Number(spell.minConfidence))
      ? Number(spell.minConfidence)
      : 0.62;
    const aliases = [spell.phrase].concat(Array.isArray(spell.aliases) ? spell.aliases : []);
    for (const alias of aliases) {
      const tokens = tokenizeAliasText(alias);
      if (!tokens.length) continue;
      const key = `${spell.id}::${tokens.join(" ")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      /** @type {KwsAliasEntry} */
      const entry = {
        spellId: String(spell.id),
        alias: String(alias || ""),
        tokens,
        minConfidence,
      };
      all.push(entry);
      const count = tokens.length;
      if (!byTokenCount.has(count)) byTokenCount.set(count, []);
      byTokenCount.get(count).push(entry);
    }
  }

  return { byTokenCount, all };
}
