import { ACTIVE_WORDS_BY_ID } from "../wordbook.js?v=20260519pyromodulafb";
import { DEFAULT_KWS_LISTEN_POLICY_MODE } from "../voice-config.js";
import {
  AXIS_WORD_IDS,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  PATH_BOARD_TRAIL_ROWS,
  PATH_BOARD_WORDS,
  WAKE_ARM_WORD_IDS,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WORD_RUNTIME_ROUTING,
} from "../../content/spells/spell-runtime-routing.js?v=20260519pyromodulafb";

function resolveActivePhrasesByIds(ids = []) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => ACTIVE_WORDS_BY_ID[String(id || "").trim().toLowerCase()])
    .filter(Boolean)
    .map((word) => String(word.phrase || word.id || "").trim().toLowerCase())
    .filter(Boolean);
}

export function createKwsRuntimeConfig() {
  const wakeWordIds = Array.isArray(WAKE_ARM_WORD_IDS)
    ? WAKE_ARM_WORD_IDS
    : [];
  const rowTop = resolveActivePhrasesByIds(KWS_ROW_TOP_WORD_IDS);
  const rowBottom = resolveActivePhrasesByIds(KWS_ROW_BOTTOM_WORD_IDS);
  const wakeWindowTokens = resolveActivePhrasesByIds(WAKE_WINDOW_WORD_IDS);
  const axisTokens = resolveActivePhrasesByIds(AXIS_WORD_IDS);
  const wakeTokens = resolveActivePhrasesByIds(wakeWordIds.length ? wakeWordIds : ["orbis"]);
  const wakeRequiredTokens = resolveActivePhrasesByIds(WAKE_REQUIRED_WORD_IDS);
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
    listenPolicyMode: DEFAULT_KWS_LISTEN_POLICY_MODE,
    gateTimeoutMs: 1500,
    readoutTickMs: 400,
    rowTop,
    rowBottom,
    wakeWindowTokens,
    axisTokens,
    wakeTokens,
    wakeRequiredTokens,
    pathBoardWords: Array.isArray(PATH_BOARD_WORDS)
      ? PATH_BOARD_WORDS.map((entry) => Object.freeze({ ...entry }))
      : [],
    pathBoardTrailRows: Array.isArray(PATH_BOARD_TRAIL_ROWS)
      ? PATH_BOARD_TRAIL_ROWS.map((row) => Object.freeze({
        ...row,
        steps: Object.freeze((Array.isArray(row && row.steps) ? row.steps : []).map((entry) => Object.freeze({ ...entry }))),
      }))
      : [],
    spinWordByAxis: Object.freeze({}),
    logTokens: tokenList.slice(),
    tempUngatedTokens: tokenList.slice(),
    tokenCanonicalMap,
  };
}
