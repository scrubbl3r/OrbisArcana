import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  KWS_FLASH_TOKEN_WORD_IDS,
  WAKE_WINDOW_WORD_IDS as KWS_WAKE_WINDOW_WORD_IDS,
} from "../../content/spells/spell-runtime-routing.js";
import {
  ORCHESTRATOR_V2_WAKE_WORD_IDS,
} from "../../content/interactions-v2/orchestrator-v2-wake-profile.js";

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
  const isWakeWindowActive = typeof deps.isWakeWindowActive === "function" ? deps.isWakeWindowActive : () => false;
  const markHeardWakeWindowToken = typeof deps.markHeardWakeWindowToken === "function" ? deps.markHeardWakeWindowToken : null;
  const getFlatSpinAxis = typeof deps.getFlatSpinAxis === "function" ? deps.getFlatSpinAxis : () => "";
  const openKwsWakeHudGate = typeof deps.openKwsWakeHudGate === "function" ? deps.openKwsWakeHudGate : () => {};
  const shouldLogHeardWakeword = typeof deps.shouldLogHeardWakeword === "function" ? deps.shouldLogHeardWakeword : () => false;
  const pushKwsLogLine = typeof deps.pushKwsLogLine === "function" ? deps.pushKwsLogLine : () => {};
  const updateKwsReadout = typeof deps.updateKwsReadout === "function" ? deps.updateKwsReadout : () => {};
  const isUngatedToken = typeof deps.isUngatedToken === "function" ? deps.isUngatedToken : () => false;
  const setFlatSpinAxis = typeof deps.setFlatSpinAxis === "function" ? deps.setFlatSpinAxis : null;
  const clearFlatSpinState = typeof deps.clearFlatSpinState === "function" ? deps.clearFlatSpinState : null;
  const resetHeardWakeWindowTokensForAxis = typeof deps.resetHeardWakeWindowTokensForAxis === "function" ? deps.resetHeardWakeWindowTokensForAxis : () => {};
  const resetHeardWakeWindowTokensAllAxes = typeof deps.resetHeardWakeWindowTokensAllAxes === "function" ? deps.resetHeardWakeWindowTokensAllAxes : () => {};
  const setSelectedAxisWord = typeof deps.setSelectedAxisWord === "function"
    ? deps.setSelectedAxisWord
    : (typeof deps.setSelectedAxisSpell === "function" ? deps.setSelectedAxisSpell : null);
  const getKwsMode = typeof deps.getKwsMode === "function" ? deps.getKwsMode : () => String(kwsDebugState.mode || "");
  const gateTimeoutMs = Math.max(0, Number(deps.gateTimeoutMs) || 1500);
  const wakeWordIds = new Set(
    (Array.isArray(ORCHESTRATOR_V2_WAKE_WORD_IDS) ? ORCHESTRATOR_V2_WAKE_WORD_IDS : [])
      .map((wordId) => String(wordId || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const wakeTokenSet = new Set(
    Array.from(wakeWordIds)
      .map((wordId) => ACTIVE_WORDS_BY_ID[String(wordId || "").trim().toLowerCase()])
      .filter(Boolean)
      .map((word) => String(word.phrase || word.id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const flashTokenSet = new Set(
    (Array.isArray(KWS_FLASH_TOKEN_WORD_IDS) ? KWS_FLASH_TOKEN_WORD_IDS : [])
      .map((wordId) => ACTIVE_WORDS_BY_ID[String(wordId || "").trim().toLowerCase()])
      .filter(Boolean)
      .map((word) => String(word.phrase || word.id || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const wakeWindowTokenSet = new Set(
    (Array.isArray(KWS_WAKE_WINDOW_WORD_IDS) ? KWS_WAKE_WINDOW_WORD_IDS : [])
      .map((wordId) => ACTIVE_WORDS_BY_ID[String(wordId || "").trim().toLowerCase()])
      .filter(Boolean)
      .map((word) => String(word.phrase || word.id || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const unsub = [];
  const getWordIdFromPayload = (p = {}) => String((p.wordId ?? p.spellId) || "").trim().toLowerCase();
  const getAxisWordFromPayload = (p = {}) => String((p.axisWord ?? p.axisSpell) || "").trim().toLowerCase();

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_TOKEN_DETECTED, (p = {}) => {
    const token = canonicalKwsToken(p.token);
    kwsDebugState.lastToken = token;
    if (isUngatedToken(token)) flashKwsToken(token);
    if (flashTokenSet.has(token)) {
      flashKwsToken(token);
    }
    if (isWakeWindowActive() && wakeWindowTokenSet.has(token)) {
      const axis = String(getFlatSpinAxis() || "").trim().toLowerCase();
      if ((axis === "x" || axis === "y" || axis === "z") && typeof markHeardWakeWindowToken === "function") {
        markHeardWakeWindowToken(axis, token);
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
      if (typeof setSelectedAxisWord === "function") setSelectedAxisWord(prevAxis, "");
      resetHeardWakeWindowTokensForAxis(prevAxis);
    }
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED, () => {
    if (typeof clearFlatSpinState === "function") clearFlatSpinState();
    else resetHeardWakeWindowTokensAllAxes();
    updateKwsReadout();
  }));

  function onAxisSelected(p = {}) {
    const axis = String(p.axis || "").trim().toLowerCase();
    const axisWord = getAxisWordFromPayload(p);
    if (axis === "x" || axis === "y" || axis === "z") {
      if (typeof setSelectedAxisWord === "function") setSelectedAxisWord(axis, axisWord);
      resetHeardWakeWindowTokensForAxis(axis);
      if (axisWord === "electrum") flashKwsToken("electrum", 520);
    }
    updateKwsReadout();
  }

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_AXIS_SELECTED, onAxisSelected));

  const kwsCandidateEvent = RECEIVER_EVENTS.EVT_VOICE_KWS_WORD_CANDIDATE || RECEIVER_EVENTS.EVT_VOICE_KWS_SPELL_CANDIDATE;
  unsub.push(eventBus.on(kwsCandidateEvent, (p = {}) => {
    const matched = !!p.matched;
    const wordId = getWordIdFromPayload(p);
    const phrase = String(p.phrase || "");
    kwsDebugState.lastCandidate = matched ? (wordId || phrase || "match") : (phrase || "no-match");
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_SPELL_REJECTED, (p = {}) => {
    void p;
  }));

  function onRuleEngineWakeWindowOpened(p = {}) {
    const ttlMs = Math.max(0, Number(p.ttlMs) || gateTimeoutMs);
    openKwsWakeHudGate(ttlMs);
    updateKwsReadout();
  }

  unsub.push(eventBus.on("rule_engine.wake_win_opened", onRuleEngineWakeWindowOpened));

  return {
    dispose() {
      for (const off of unsub) {
        if (typeof off === "function") off();
      }
    },
  };
}
