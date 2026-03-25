import { ACTIVE_WORDS_BY_ID } from "../wordbook.js";
import {
  KWS_FLASH_TOKEN_WORD_IDS,
  WAKE_WINDOW_WORD_IDS as KWS_WAKE_WINDOW_WORD_IDS,
} from "../../content/spells/spell-runtime-routing.js";
import {
  ORCHESTRATOR_V2_WAKE_WORD_IDS,
  ORCHESTRATOR_V2_WAKE_TTL_MS,
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
  const getActiveSpinAxis = typeof deps.getActiveSpinAxis === "function"
    ? deps.getActiveSpinAxis
    : (typeof deps.getFlatSpinAxis === "function" ? deps.getFlatSpinAxis : () => "");
  const openKwsWakeHudGate = typeof deps.openKwsWakeHudGate === "function" ? deps.openKwsWakeHudGate : () => {};
  const shouldLogHeardWakeword = typeof deps.shouldLogHeardWakeword === "function" ? deps.shouldLogHeardWakeword : () => false;
  const pushKwsLogLine = typeof deps.pushKwsLogLine === "function" ? deps.pushKwsLogLine : () => {};
  const updateKwsReadout = typeof deps.updateKwsReadout === "function" ? deps.updateKwsReadout : () => {};
  const isUngatedToken = typeof deps.isUngatedToken === "function" ? deps.isUngatedToken : () => false;
  const setActiveSpinAxis = typeof deps.setActiveSpinAxis === "function"
    ? deps.setActiveSpinAxis
    : (typeof deps.setFlatSpinAxis === "function" ? deps.setFlatSpinAxis : null);
  const clearActiveSpinState = typeof deps.clearActiveSpinState === "function"
    ? deps.clearActiveSpinState
    : (typeof deps.clearFlatSpinState === "function" ? deps.clearFlatSpinState : null);
  const resetHeardWakeWindowTokensForAxis = typeof deps.resetHeardWakeWindowTokensForAxis === "function" ? deps.resetHeardWakeWindowTokensForAxis : () => {};
  const resetHeardWakeWindowTokensAllAxes = typeof deps.resetHeardWakeWindowTokensAllAxes === "function" ? deps.resetHeardWakeWindowTokensAllAxes : () => {};
  const setSelectedAxisWord = typeof deps.setSelectedAxisWord === "function"
    ? deps.setSelectedAxisWord
    : (typeof deps.setSelectedAxisSpell === "function" ? deps.setSelectedAxisSpell : null);
  const getKwsMode = typeof deps.getKwsMode === "function" ? deps.getKwsMode : () => String(kwsDebugState.mode || "");
  const gateTimeoutMs = Math.max(0, Number(deps.gateTimeoutMs) || 1500);
  const wakeTtlMs = Math.max(0, Number(ORCHESTRATOR_V2_WAKE_TTL_MS) || gateTimeoutMs);
  let wakeArmedUntilMs = 0;
  let lastTeleHomeFallbackAtMs = 0;
  let electrumWindowUntilMs = 0;
  let lastElectricAoeFallbackAtMs = 0;
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
  const getDetectedWordId = (p = {}) => {
    const direct = String((p.wordId ?? p.spellId) || "").trim().toLowerCase();
    if (direct) return direct;
    const nestedWord = String(p?.word?.id || "").trim().toLowerCase();
    if (nestedWord) return nestedWord;
    const nestedSpell = String(p?.spell?.id || "").trim().toLowerCase();
    return nestedSpell;
  };

  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_TOKEN_DETECTED, (p = {}) => {
    const token = canonicalKwsToken(p.token);
    const now = Date.now();
    kwsDebugState.lastToken = token;
    if (isUngatedToken(token)) flashKwsToken(token);
    if (flashTokenSet.has(token)) {
      flashKwsToken(token);
    }
    if (isWakeWindowActive() && wakeWindowTokenSet.has(token)) {
      const axis = String(getActiveSpinAxis() || "").trim().toLowerCase();
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
    if (wakeTokenSet.has(token)) {
      wakeArmedUntilMs = Math.max(wakeArmedUntilMs, now + wakeTtlMs);
    }
    if (shouldLogHeardWakeword(token)) pushKwsLogLine(token);
    updateKwsReadout();
  }));

  // Bridge providers that emit only `voice.word_detected` for wake words:
  // open wake windows by mirroring them into canonical token events.
  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_WORD_DETECTED, (p = {}) => {
    const now = Date.now();
    const wordId = getDetectedWordId(p);
    if (!wakeWordIds.has(wordId)) return;
    const phrase = String((ACTIVE_WORDS_BY_ID[wordId] && ACTIVE_WORDS_BY_ID[wordId].phrase) || wordId)
      .trim()
      .toLowerCase();
    const token = canonicalKwsToken(phrase);
    if (!token) return;
    eventBus.emit(RECEIVER_EVENTS.EVT_VOICE_TOKEN_DETECTED, {
      token,
      confidence: Number.isFinite(Number(p.confidence)) ? Number(p.confidence) : 1,
      atMs: Number.isFinite(Number(p.atMs)) ? Number(p.atMs) : Date.now(),
      providerId: String(p.providerId || p.source || "word_bridge"),
      source: "word_bridge",
    });
    wakeArmedUntilMs = Math.max(wakeArmedUntilMs, now + wakeTtlMs);
  }));

  // Safety bridge: preserve legacy expectation `orbis -> domus => teleport_home`
  // even when upstream provider timing/source differences suppress a rule-engine match.
  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_WORD_DETECTED, (p = {}) => {
    const now = Date.now();
    const wordId = getDetectedWordId(p);
    if (wordId !== "domus") return;
    if (now > wakeArmedUntilMs) return;
    if ((now - lastTeleHomeFallbackAtMs) < 250) return;
    lastTeleHomeFallbackAtMs = now;
    eventBus.emit("rule_engine.action_executed", {
      ruleId: "tele_home_fallback",
      actionType: "event",
      actionId: "teleport_home",
      args: {},
      atMs: now,
    });
    pushKwsLogLine("TRACE fallback:tele_home", "ok");
  }));

  // Safety bridge: preserve expected `orbis -> electrum -> rota => aoe_electric`
  // while runtime chain migration is in progress.
  unsub.push(eventBus.on(RECEIVER_EVENTS.EVT_VOICE_WORD_DETECTED, (p = {}) => {
    const now = Date.now();
    const wordId = getDetectedWordId(p);
    if (!wordId) return;

    if (wordId === "electrum" && now <= wakeArmedUntilMs) {
      electrumWindowUntilMs = now + 1500;
      return;
    }
    if (wordId !== "rota") return;
    if (now > electrumWindowUntilMs) return;
    if ((now - lastElectricAoeFallbackAtMs) < 250) return;
    lastElectricAoeFallbackAtMs = now;
    eventBus.emit("rule_engine.action_executed", {
      ruleId: "electric_aoe_fallback",
      actionType: "event",
      actionId: "aoe_electric",
      args: {},
      atMs: now,
    });
    pushKwsLogLine("TRACE fallback:electric_aoe", "ok");
  }));

  unsub.push(eventBus.on(
    RECEIVER_EVENTS.EVT_SPELL_WINDOW_SPIN_OPENED || RECEIVER_EVENTS.EVT_SPELL_WINDOW_FLAT_SPIN_OPENED,
    (p = {}) => {
    const axis = String(p.axis || "").trim().toLowerCase();
    if (typeof setActiveSpinAxis === "function") setActiveSpinAxis(axis);
    const prevAxis = String(getActiveSpinAxis() || "").trim().toLowerCase();
    if (prevAxis) {
      if (typeof setSelectedAxisWord === "function") setSelectedAxisWord(prevAxis, "");
      resetHeardWakeWindowTokensForAxis(prevAxis);
    }
    updateKwsReadout();
  }));

  unsub.push(eventBus.on(
    RECEIVER_EVENTS.EVT_SPELL_WINDOW_SPIN_CLOSED || RECEIVER_EVENTS.EVT_SPELL_WINDOW_FLAT_SPIN_CLOSED,
    () => {
    if (typeof clearActiveSpinState === "function") clearActiveSpinState();
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
