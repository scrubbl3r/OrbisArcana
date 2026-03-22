import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  KWS_AXIS_WORD_BY_AXIS,
  KWS_AXIS_WORD_IDS,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  KWS_WAKE_WINDOW_WORD_IDS,
  KWS_WAKE_REQUIRED_WORD_IDS,
  KWS_WAKE_WORD_IDS,
} from "../../content/interactions-v2/orchestrator-v1-kws-profile.js";

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
  const wakeWindowTokens = resolveActivePhrasesByIds(KWS_WAKE_WINDOW_WORD_IDS);
  const axisTokens = resolveActivePhrasesByIds(KWS_AXIS_WORD_IDS);
  const wakeTokens = resolveActivePhrasesByIds(KWS_WAKE_WORD_IDS);
  const wakeRequiredTokens = resolveActivePhrasesByIds(KWS_WAKE_REQUIRED_WORD_IDS);
  const axisWordByAxis = Object.create(null);
  for (const axis of ["x", "y", "z"]) {
    const axisWordId = String(KWS_AXIS_WORD_BY_AXIS[axis] || "").trim().toLowerCase();
    const active = ACTIVE_WORDS_BY_ID[axisWordId] || null;
    const axisWordToken = String((active && active.phrase) || axisWordId || "").trim().toLowerCase();
    if (axisWordToken) axisWordByAxis[axis] = axisWordToken;
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
