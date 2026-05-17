import { COMPILED_INTERACTION_GRAPH_V2 } from "./compiled-interaction-graph-v2.js?v=20260516c";
import { WORDBOOK_V2_ACTIVE_WORDS_BY_ID } from "./wordbook-v2.js?v=20260516c";

function asText(value) {
  return String(value || "").trim();
}

function normalizeWordId(value) {
  return asText(value).toLowerCase();
}

function asSelectorList(raw) {
  if (Array.isArray(raw)) return raw.slice();
  const value = asText(raw);
  if (!value) return [];
  if (value.includes(",")) {
    return value.split(",").map((token) => asText(token)).filter(Boolean);
  }
  return [value];
}

function unique(values) {
  return Array.from(new Set(values));
}

function asWakeWords(wakeRaw) {
  if (!wakeRaw) return [];
  const wakeObj = (wakeRaw && typeof wakeRaw === "object" && !Array.isArray(wakeRaw))
    ? wakeRaw
    : null;
  const wordsRaw = wakeObj
    ? (Object.hasOwn(wakeObj, "words") ? wakeObj.words : wakeObj.spells)
    : wakeRaw;
  return unique(
    asSelectorList(wordsRaw)
      .map((entry) => normalizeWordId(entry))
      .filter(Boolean)
      .filter((id) => Object.hasOwn(WORDBOOK_V2_ACTIVE_WORDS_BY_ID, id))
  );
}

function asWakeTtlMs(wakeRaw) {
  const wakeObj = (wakeRaw && typeof wakeRaw === "object" && !Array.isArray(wakeRaw))
    ? wakeRaw
    : null;
  const ttlMs = Number(wakeObj && wakeObj.ttlMs);
  if (!Number.isFinite(ttlMs) || ttlMs < 0) return 0;
  return ttlMs;
}

export const COMPILED_INTERACTION_GRAPH_V2_WAKE_WORD_IDS = Object.freeze(asWakeWords(COMPILED_INTERACTION_GRAPH_V2.wake));
export const COMPILED_INTERACTION_GRAPH_V2_WAKE_TTL_MS = asWakeTtlMs(COMPILED_INTERACTION_GRAPH_V2.wake);
