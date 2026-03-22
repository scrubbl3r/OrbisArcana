import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  AXIS_WORD_IDS,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WORD_IDS,
  WORD_RUNTIME_ROUTING_BY_WORD_ID,
} from "../../content/spells/spell-runtime-routing.js";

function resolveActivePhrasesByIds(ids = []) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => ACTIVE_WORDS_BY_ID[String(id || "").trim().toLowerCase()])
    .filter(Boolean)
    .map((word) => String(word.phrase || word.id || "").trim().toLowerCase())
    .filter(Boolean);
}

export function createKwsRuntimeConfig() {
  const rowTop = resolveActivePhrasesByIds(KWS_ROW_TOP_WORD_IDS);
  const rowBottom = resolveActivePhrasesByIds(KWS_ROW_BOTTOM_WORD_IDS);
  const wakeWindowTokens = resolveActivePhrasesByIds(WAKE_WINDOW_WORD_IDS);
  const axisTokens = resolveActivePhrasesByIds(AXIS_WORD_IDS);
  const wakeTokens = resolveActivePhrasesByIds(WAKE_WORD_IDS);
  const wakeRequiredTokens = resolveActivePhrasesByIds(WAKE_REQUIRED_WORD_IDS);
  const axisWordByAxis = Object.create(null);
  for (const wordId of AXIS_WORD_IDS) {
    const id = String(wordId || "").trim().toLowerCase();
    const routing = WORD_RUNTIME_ROUTING_BY_WORD_ID[id] || null;
    const active = ACTIVE_WORDS_BY_ID[id] || null;
    const axisWordToken = String((active && active.phrase) || id || "").trim().toLowerCase();
    const axes = Array.isArray(routing && routing.allowedAxes) ? routing.allowedAxes : [];
    for (const axis of axes) {
      const a = String(axis || "").trim().toLowerCase();
      if (a === "x" || a === "y" || a === "z") axisWordByAxis[a] = axisWordToken;
    }
  }
  const tokenList = Array.from(new Set(rowTop.concat(rowBottom)));
  const tokenCanonicalMap = Object.freeze(
    Object.values(ACTIVE_WORDS_BY_ID).reduce((acc, word) => {
      const id = String(word && word.id || "").trim().toLowerCase();
      const phrase = String(word && (word.phrase || word.id) || "").trim().toLowerCase();
      if (!id || !phrase) return acc;
      if (id !== phrase) acc[id] = phrase;
      return acc;
    }, {})
  );
  return {
    defaultVoiceEngine: "kws",
    defaultBackendKey: "openwakeword_browser",
    autostartRetryMs: 2000,
    autostartMaxMs: 120000,
    autostartRekickMs: 5000,
    startStallMs: 8000,
    gateTimeoutMs: 1500,
    readoutTickMs: 250,
    rowTop,
    rowBottom,
    wakeWindowTokens,
    axisTokens,
    wakeTokens,
    wakeRequiredTokens,
    axisWordByAxis: Object.freeze({ ...axisWordByAxis }),
    axisSpellByAxis: Object.freeze({ ...axisWordByAxis }),
    logTokens: tokenList.slice(),
    tempUngatedTokens: tokenList.slice(),
    tokenCanonicalMap,
  };
}
