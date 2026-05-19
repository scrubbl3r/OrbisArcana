import { ACTIVE_WORDS } from "../wordbook.js?v=20260519pyromodulafb";
import { normalizeTranscript } from "../normalizer.js";

/**
 * @typedef {Object} KwsWordAliasEntry
 * @property {string} wordId
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
 * Builds a tokenized alias index from the canonical wordbook so KWS parsing
 * shares the same source of truth as the current STT matcher.
 *
 * @param {Array<Object>} [words]
 * @returns {{ byTokenCount: Map<number, KwsWordAliasEntry[]>, all: KwsWordAliasEntry[] }}
 */
export function buildKwsWordAliasIndex(words = ACTIVE_WORDS) {
  const byTokenCount = new Map();
  const all = [];
  const seen = new Set();

  for (const word of Array.isArray(words) ? words : []) {
    if (!word || !word.id) continue;
    if (word.active === false) continue;
    const minConfidence = Number.isFinite(Number(word.minConfidence))
      ? Number(word.minConfidence)
      : 0.62;
    const aliases = [word.phrase].concat(Array.isArray(word.aliases) ? word.aliases : []);
    for (const alias of aliases) {
      const tokens = tokenizeAliasText(alias);
      if (!tokens.length) continue;
      const key = `${word.id}::${tokens.join(" ")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      /** @type {KwsWordAliasEntry} */
      const entry = {
        wordId: String(word.id),
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

// Legacy compatibility export.
export const buildKwsSpellAliasIndex = buildKwsWordAliasIndex;
