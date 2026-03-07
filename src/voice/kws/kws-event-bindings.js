import { ACTIVE_SPELLS_BY_ID } from "../spellbook.js";
import {
  CLASS_SPELL_IDS,
  KWS_FLASH_TOKEN_SPELL_IDS,
  WAKE_SPELL_IDS,
} from "../../content/spells/spell-runtime-routing-v1.js";

export function bindKwsEventHandlers({
  eventBus,
  events,
  state = {},
  deps = {},
} = {}) {
  if (!eventBus || typeof eventBus.on !== "function") {
    return { dispose() {} };
  }
  const RECEIVER_EVENTS = (events && typeof events === "object") ? events : {};
  const kwsDebugState = (state && typeof state === "object") ? state : {};

  const canonicalKwsToken = typeof deps.canonicalKwsToken === "function" ? deps.canonicalKwsToken : (x) => String(x || "");
  const flashKwsToken = typeof deps.flashKwsToken === "function" ? deps.flashKwsToken : () => {};
  const isClassWindowActive = typeof deps.isClassWindowActive === "function" ? deps.isClassWindowActive : () => false;
  const markHeardClassToken = typeof deps.markHeardClassToken === "function" ? deps.markHeardClassToken : null;
  const getFlatSpinAxis = typeof deps.getFlatSpinAxis === "function" ? deps.getFlatSpinAxis : () => "";
  const openKwsWakeHudGate = typeof deps.openKwsWakeHudGate === "function" ? deps.openKwsWakeHudGate : () => {};
  const shouldLogHeardWakeword = typeof deps.shouldLogHeardWakeword === "function" ? deps.shouldLogHeardWakeword : () => false;
  const pushKwsLogLine = typeof deps.pushKwsLogLine === "function" ? deps.pushKwsLogLine : () => {};
  const updateKwsReadout = typeof deps.updateKwsReadout === "function" ? deps.updateKwsReadout : () => {};
  const isUngatedToken = typeof deps.isUngatedToken === "function" ? deps.isUngatedToken : () => false;
  const setFlatSpinAxis = typeof deps.setFlatSpinAxis === "function" ? deps.setFlatSpinAxis : null;
  const clearFlatSpinState = typeof deps.clearFlatSpinState === "function" ? deps.clearFlatSpinState : null;
  const resetHeardClassTokensForAxis = typeof deps.resetHeardClassTokensForAxis === "function" ? deps.resetHeardClassTokensForAxis : () => {};
  const resetHeardClassTokensAllAxes = typeof deps.resetHeardClassTokensAllAxes === "function" ? deps.resetHeardClassTokensAllAxes : () => {};
  const setSelectedSchool = typeof deps.setSelectedSchool === "function" ? deps.setSelectedSchool : null;
  const getKwsMode = typeof deps.getKwsMode === "function" ? deps.getKwsMode : () => String(kwsDebugState.mode || "");
  const gateTimeoutMs = Math.max(0, Number(deps.gateTimeoutMs) || 1500);
  const wakeTokenSet = new Set(
    (Array.isArray(WAKE_SPELL_IDS) ? WAKE_SPELL_IDS : [])
      .map((spellId) => ACTIVE_SPELLS_BY_ID[String(spellId || "").trim().toLowerCase()])
      .filter(Boolean)
      .map((spell) => String(spell.phrase || spell.id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const flashTokenSet = new Set(
    (Array.isArray(KWS_FLASH_TOKEN_SPELL_IDS) ? KWS_FLASH_TOKEN_SPELL_IDS : [])
      .map((spellId) => ACTIVE_SPELLS_BY_ID[String(spellId || "").trim().toLowerCase()])
      .filter(Boolean)
      .map((spell) => String(spell.phrase || spell.id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const classTokenSet = new Set(
    (Array.isArray(CLASS_SPELL_IDS) ? CLASS_SPELL_IDS : [])
      .map((spellId) => ACTIVE_SPELLS_BY_ID[String(spellId || "").trim().toLowerCase()])
      .filter(Boolean)
      .map((spell) => String(spell.phrase || spell.id || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const unsub = [];

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_TOKEN_DETECTED, (p = {}) => {
    const token = canonicalKwsToken(p.token);
    kwsDebugState.lastToken = token;
    if (isUngatedToken(token)) flashKwsToken(token);
    if (flashTokenSet.has(token)) {
      flashKwsToken(token);
    }
    if (isClassWindowActive() && classTokenSet.has(token)) {
      const axis = String(getFlatSpinAxis() || "").trim().toLowerCase();
      if ((axis === "x" || axis === "y" || axis === "z") && typeof markHeardClassToken === "function") {
        markHeardClassToken(axis, token);
      }
      flashKwsToken(token);
    }
    const kwsEngineMode = String(getKwsMode() || "").toLowerCase();
    if (kwsEngineMode === "kws" && wakeTokenSet.has(token)) {
      eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_SET_MODE, { mode: "wake_token_open_world" });
      openKwsWakeHudGate(gateTimeoutMs);
    }
    if (shouldLogHeardWakeword(token)) pushKwsLogLine(token);
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_SPELL_WINDOW_FLAT_SPIN_OPENED, (p = {}) => {
    const axis = String(p.axis || "").trim().toLowerCase();
    if (typeof setFlatSpinAxis === "function") setFlatSpinAxis(axis);
    const prevAxis = String(getFlatSpinAxis() || "").trim().toLowerCase();
    if (prevAxis) {
      if (typeof setSelectedSchool === "function") setSelectedSchool(prevAxis, "");
      resetHeardClassTokensForAxis(prevAxis);
    }
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED, () => {
    if (typeof clearFlatSpinState === "function") clearFlatSpinState();
    else resetHeardClassTokensAllAxes();
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SCHOOL_SELECTED, (p = {}) => {
    const axis = String(p.axis || "").trim().toLowerCase();
    const school = String(p.school || "").trim().toLowerCase();
    if (axis === "x" || axis === "y" || axis === "z") {
      if (typeof setSelectedSchool === "function") setSelectedSchool(axis, school);
      resetHeardClassTokensForAxis(axis);
      if (school === "electrum") flashKwsToken("electrum", 520);
    }
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_KWS_SPELL_CANDIDATE, (p = {}) => {
    const matched = !!p.matched;
    const spellId = String(p.spellId || "");
    const phrase = String(p.phrase || "");
    kwsDebugState.lastCandidate = matched ? (spellId || phrase || "match") : (phrase || "no-match");
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_REJECTED, (p = {}) => {
    void p;
  }));

  unsub.push(eventBus.on("rule_engine.v1.wake_win_opened", (p = {}) => {
    const ttlMs = Math.max(0, Number(p.ttlMs) || gateTimeoutMs);
    openKwsWakeHudGate(ttlMs);
    updateKwsReadout();
  }));

  return {
    dispose() {
      for (const off of unsub) {
        if (typeof off === "function") off();
      }
    },
  };
}
