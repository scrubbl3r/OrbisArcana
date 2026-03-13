import { ACTIVE_SPELLS_BY_ID } from "../spellbook.js";
import {
  AXIS_WORD_IDS,
  KWS_ROW_BOTTOM_WORD_IDS,
  KWS_ROW_TOP_WORD_IDS,
  WAKE_WINDOW_WORD_IDS,
  WAKE_REQUIRED_WORD_IDS,
  WAKE_WORD_IDS,
  SPELL_RUNTIME_ROUTING_BY_WORD_ID,
} from "../../content/spells/spell-runtime-routing.js";

function resolveActivePhrasesByIds(ids = []) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => ACTIVE_SPELLS_BY_ID[String(id || "").trim().toLowerCase()])
    .filter(Boolean)
    .map((spell) => String(spell.phrase || spell.id || "").trim().toLowerCase())
    .filter(Boolean);
}

export function createKwsRuntimeConfig() {
  const rowTop = resolveActivePhrasesByIds(KWS_ROW_TOP_WORD_IDS);
  const rowBottom = resolveActivePhrasesByIds(KWS_ROW_BOTTOM_WORD_IDS);
  const wakeWindowTokens = resolveActivePhrasesByIds(WAKE_WINDOW_WORD_IDS);
  const axisTokens = resolveActivePhrasesByIds(AXIS_WORD_IDS);
  const wakeTokens = resolveActivePhrasesByIds(WAKE_WORD_IDS);
  const wakeRequiredTokens = resolveActivePhrasesByIds(WAKE_REQUIRED_WORD_IDS);
  const axisSpellByAxis = Object.create(null);
  for (const spellId of AXIS_WORD_IDS) {
    const id = String(spellId || "").trim().toLowerCase();
    const routing = SPELL_RUNTIME_ROUTING_BY_WORD_ID[id] || null;
    const active = ACTIVE_SPELLS_BY_ID[id] || null;
    const axisSpellToken = String((active && active.phrase) || id || "").trim().toLowerCase();
    const axes = Array.isArray(routing && routing.allowedAxes) ? routing.allowedAxes : [];
    for (const axis of axes) {
      const a = String(axis || "").trim().toLowerCase();
      if (a === "x" || a === "y" || a === "z") axisSpellByAxis[a] = axisSpellToken;
    }
  }
  const tokenList = Array.from(new Set(rowTop.concat(rowBottom)));
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
    axisSpellByAxis: Object.freeze({ ...axisSpellByAxis }),
    logTokens: tokenList.slice(),
    tempUngatedTokens: tokenList.slice(),
    tokenCanonicalMap: Object.freeze({
      idnis: "ignis",
    }),
  };
}
