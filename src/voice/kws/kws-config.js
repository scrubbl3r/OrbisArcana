import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  AXIS_WORD_IDS,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WORD_RUNTIME_ROUTING,
} from "../../content/spells/spell-runtime-routing.js";
import { ORCHESTRATOR_V2_WAKE_WORD_IDS } from "../../content/interactions-v2/orchestrator-v2-wake-profile.js";

function resolveActivePhrasesByIds(ids = []) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => ACTIVE_WORDS_BY_ID[String(id || "").trim().toLowerCase()])
    .filter(Boolean)
    .map((word) => String(word.phrase || word.id || "").trim().toLowerCase())
    .filter(Boolean);
}

export function createKwsRuntimeConfig() {
  const wakeWordIds = Array.isArray(ORCHESTRATOR_V2_WAKE_WORD_IDS)
    ? ORCHESTRATOR_V2_WAKE_WORD_IDS
    : [];
  const rowTop = resolveActivePhrasesByIds(KWS_ROW_TOP_WORD_IDS);
  const rowBottom = resolveActivePhrasesByIds(KWS_ROW_BOTTOM_WORD_IDS);
  const wakeWindowTokens = resolveActivePhrasesByIds(WAKE_WINDOW_WORD_IDS);
  const axisTokens = resolveActivePhrasesByIds(AXIS_WORD_IDS);
  const wakeTokens = resolveActivePhrasesByIds(wakeWordIds.length ? wakeWordIds : ["orbis"]);
  const wakeRequiredTokens = resolveActivePhrasesByIds(WAKE_REQUIRED_WORD_IDS);
  const axisWordByAxis = Object.create(null);
  for (const item of (Array.isArray(WORD_RUNTIME_ROUTING) ? WORD_RUNTIME_ROUTING : [])) {
    const intent = String(item && item.intent || "").trim().toLowerCase();
    if (intent !== "spell.axis_select") continue;
    const allowedAxes = Array.isArray(item && item.allowedAxes) ? item.allowedAxes : [];
    if (allowedAxes.length !== 1) continue;
    const axis = String(allowedAxes[0] || "").trim().toLowerCase();
    if (axis !== "x" && axis !== "y" && axis !== "z") continue;
    const axisWordId = String(item && (item.axisWord || item.axisSpell || item.id) || "").trim().toLowerCase();
    const active = ACTIVE_WORDS_BY_ID[axisWordId] || null;
    const axisWordToken = String((active && active.phrase) || axisWordId || "").trim().toLowerCase();
    if (axisWordToken && !axisWordByAxis[axis]) axisWordByAxis[axis] = axisWordToken;
  }
  for (const axis of ["x", "y", "z"]) {
    if (axisWordByAxis[axis]) continue;
    const fallbackAxisWordId = axis === "x" ? "fridgis" : (axis === "z" ? "electrum" : "pyro");
    const fallbackActive = ACTIVE_WORDS_BY_ID[fallbackAxisWordId] || null;
    const fallbackToken = String((fallbackActive && fallbackActive.phrase) || fallbackAxisWordId).trim().toLowerCase();
    if (fallbackToken) axisWordByAxis[axis] = fallbackToken;
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
