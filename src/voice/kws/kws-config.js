import { ACTIVE_SPELLS_BY_ID } from "../spellbook.js";
import {
  CLASS_SPELL_IDS,
  KWS_ROW_BOTTOM_SPELL_IDS,
  KWS_ROW_TOP_SPELL_IDS,
} from "../../content/spells/spell-runtime-routing-v1.js";

function resolveActivePhrasesByIds(ids = []) {
  return (Array.isArray(ids) ? ids : [])
    .map((id) => ACTIVE_SPELLS_BY_ID[String(id || "").trim().toLowerCase()])
    .filter(Boolean)
    .map((spell) => String(spell.phrase || spell.id || "").trim().toLowerCase())
    .filter(Boolean);
}

export function createKwsRuntimeConfig() {
  const rowTop = resolveActivePhrasesByIds(KWS_ROW_TOP_SPELL_IDS);
  const rowBottom = resolveActivePhrasesByIds(KWS_ROW_BOTTOM_SPELL_IDS);
  const classTokens = resolveActivePhrasesByIds(CLASS_SPELL_IDS);
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
    classTokens,
    logTokens: tokenList.slice(),
    tempUngatedTokens: tokenList.slice(),
    tokenCanonicalMap: Object.freeze({}),
  };
}
