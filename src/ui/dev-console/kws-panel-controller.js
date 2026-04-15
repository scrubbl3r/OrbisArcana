import { createWordFlashboardPopup } from "./word-flashboard/word-flashboard-popup.js";
import { createLogPopupController } from "./log/log-popup-controller.js";

export function createKwsPanelController({
  els = {},
  constants = {},
  getKwsWordProvider = null,
  getKwsVoiceProvider = () => null,
  onGateOpened = null,
  onGateClosed = null,
  onApplyTune = null,
  getListenPolicyStatus = null,
} = {}) {
  const DEFAULT_KWS_GATE_TIMEOUT_MS = Math.max(250, Number(constants.defaultGateTimeoutMs) || 1500);
  const DEFAULT_KWS_START_STALL_MS = Math.max(0, Number(constants.startStallMs) || 8000);
  const KWS_READOUT_TICK_MS = Math.max(100, Number(constants.readoutTickMs) || 250);
  const KWS_LOG_DEDUP_MS = Math.max(0, Number(constants.logDedupMs) || 450);
  const KWS_PREOPEN_LOG_BUFFER_LIMIT = Math.max(10, Number(constants.preopenLogBufferLimit) || 80);
  const WORDFLASHBOARD_WORDS = Array.isArray(constants.wordFlashboardWords)
    ? constants.wordFlashboardWords.map((entry) => Object.freeze({ ...entry }))
    : [];
  const WORDFLASHBOARD_TRAIL_ROWS = Array.isArray(constants.wordFlashboardTrailRows)
    ? constants.wordFlashboardTrailRows.map((row) => Object.freeze({
      ...row,
      steps: Object.freeze((Array.isArray(row && row.steps) ? row.steps : []).map((entry) => Object.freeze({ ...entry }))),
    }))
    : [];
  const KWS_ROW_TOP = Array.isArray(constants.rowTop) ? constants.rowTop.slice() : [];
  const KWS_ROW_BOTTOM = Array.isArray(constants.rowBottom) ? constants.rowBottom.slice() : [];
  const KWS_WAKE_WINDOW_TOKENS = Array.isArray(constants.wakeWindowTokens) ? constants.wakeWindowTokens.slice() : [];
  const KWS_AXIS_TOKENS = Array.isArray(constants.axisTokens) ? constants.axisTokens.slice() : [];
  const KWS_WAKE_TOKENS = Array.isArray(constants.wakeTokens) ? constants.wakeTokens.slice() : [];
  const KWS_WAKE_REQUIRED_TOKENS = Array.isArray(constants.wakeRequiredTokens) ? constants.wakeRequiredTokens.slice() : [];
  const KWS_SPIN_WORD_BY_AXIS = (constants.spinWordByAxis && typeof constants.spinWordByAxis === "object")
    ? { ...constants.spinWordByAxis }
    : Object.create(null);
  const KWS_LOG_TOKENS = new Set(Array.isArray(constants.logTokens) ? constants.logTokens : []);
  const TEMP_UNGATED_KWS_TOKENS = new Set(Array.isArray(constants.tempUngatedTokens) ? constants.tempUngatedTokens : []);
  const KWS_TOKEN_CANONICAL_MAP = (constants.tokenCanonicalMap && typeof constants.tokenCanonicalMap === "object")
    ? constants.tokenCanonicalMap
    : Object.freeze({});
  const KWS_WAKE_WINDOW_TOKEN_SET = new Set(KWS_WAKE_WINDOW_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const KWS_AXIS_TOKEN_SET = new Set(KWS_AXIS_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const KWS_WAKE_TOKEN_SET = new Set(KWS_WAKE_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const KWS_WAKE_REQUIRED_TOKEN_SET = new Set(KWS_WAKE_REQUIRED_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const readKwsWordProvider = (typeof getKwsWordProvider === "function")
    ? getKwsWordProvider
    : getKwsVoiceProvider;

  const selectedSpinWordByAxis = { x: "", y: "", z: "" };
  const kwsTokenUiState = {
    activeSpinAxis: "",
    selectedSpinWordByAxis,
    heardWakeWindowTokensByAxis: {
      x: Object.create(null),
      y: Object.create(null),
      z: Object.create(null),
    },
    flashUntilMs: Object.create(null),
    flashTOByToken: Object.create(null),
    orbisWindowUntilMs: 0,
  };
  let manualListenableTokens = new Set();
  let manualWakeWindowTokens = new Set();
  let kwsWakeHudGateTO = 0;
  let kwsReadoutTickTO = 0;
  let kwsLastBackendErrorLogged = "";
  let pendingKwsReadoutHtml = "idle";
  const kwsEventLog = [];
  let tuneApplyBound = false;

  function readCurrentListenableTokens() {
    const status = typeof getListenPolicyStatus === "function" ? getListenPolicyStatus() : null;
    const policyTokens = (Array.isArray(status && status.listenableTokens) ? status.listenableTokens : [])
      .map((token) => canonicalKwsToken(token))
      .filter(Boolean);
    return new Set([
      ...policyTokens,
      ...Array.from(manualListenableTokens.values()),
      ...Array.from(manualWakeWindowTokens.values()),
    ]);
  }

  const wordFlashboardPopup = createWordFlashboardPopup({
    els,
    words: WORDFLASHBOARD_WORDS,
    trailRows: WORDFLASHBOARD_TRAIL_ROWS,
    canonicalToken: canonicalKwsToken,
    getListenableTokens: () => readCurrentListenableTokens(),
    getFlashUntilMs: (token) => Number(kwsTokenUiState.flashUntilMs[String(token || "").trim().toLowerCase()] || 0),
    getTrailStepState: (step = {}) => {
      const kind = String(step.kind || "").trim().toLowerCase();
      if (kind === "signal") {
        const signalId = String(step.id || "").trim().toLowerCase();
        if (signalId.startsWith("spin.")) {
          const axis = signalId.slice(5);
          return { lit: String(kwsTokenUiState.activeSpinAxis || "").trim().toLowerCase() === axis, flash: false };
        }
        return { lit: false, flash: false };
      }
      const phrase = canonicalKwsToken(step.phrase || step.id);
      const listenableTokens = readCurrentListenableTokens();
      return {
        lit: listenableTokens.has(phrase),
        flash: Number(kwsTokenUiState.flashUntilMs[phrase] || 0) > Date.now(),
      };
    },
    onVisibilityChanged: (open) => {
      if (typeof logPopupController.setWordBoardVisible === "function") {
        logPopupController.setWordBoardVisible(open);
      }
      if (!open) return;
      if (els.kwsReadout) els.kwsReadout.innerHTML = pendingKwsReadoutHtml || "idle";
      wordFlashboardPopup.render();
    },
  });
  const logPopupController = createLogPopupController({
    els,
    dedupMs: KWS_LOG_DEDUP_MS,
    preopenBufferLimit: KWS_PREOPEN_LOG_BUFFER_LIMIT,
  });

  function readNumberInputOrNull(el) {
    if (!el) return null;
    const raw = String(el.value == null ? "" : el.value).trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function expectedAxisWordForAxis(axis) {
    const a = String(axis || "").trim().toLowerCase();
    return String(KWS_SPIN_WORD_BY_AXIS[a] || "").trim().toLowerCase();
  }

  function canonicalKwsToken(rawToken) {
    const token = String(rawToken || "").trim().toLowerCase();
    if (!token) return "";
    return String(KWS_TOKEN_CANONICAL_MAP[token] || token);
  }

  function isWakeWindowActive() {
    const axis = String(kwsTokenUiState.activeSpinAxis || "").trim().toLowerCase();
    if (!(axis === "x" || axis === "y" || axis === "z")) return false;
    const selectedAxisWord = String((kwsTokenUiState.selectedSpinWordByAxis[axis] || "")).toLowerCase();
    return KWS_AXIS_TOKEN_SET.has(selectedAxisWord);
  }

  function shouldLogHeardWakeword(rawToken) {
    const token = canonicalKwsToken(rawToken);
    if (!KWS_LOG_TOKENS.has(token)) return false;
    if (TEMP_UNGATED_KWS_TOKENS.has(token)) return true;
    if (KWS_WAKE_TOKEN_SET.has(token)) return true;
    if (KWS_WAKE_REQUIRED_TOKEN_SET.has(token)) {
      return Date.now() < Number(kwsTokenUiState.orbisWindowUntilMs || 0);
    }
    if (KWS_AXIS_TOKEN_SET.has(token)) {
      const axis = String(kwsTokenUiState.activeSpinAxis || "").trim().toLowerCase();
      return !!axis && token === expectedAxisWordForAxis(axis);
    }
    if (KWS_WAKE_WINDOW_TOKEN_SET.has(token)) {
      return isWakeWindowActive();
    }
    return false;
  }

  function resetHeardWakeWindowTokensForAxis(axis) {
    const a = String(axis || "").trim().toLowerCase();
    if (!(a === "x" || a === "y" || a === "z")) return;
    const bucket = Object.create(null);
    for (const token of KWS_WAKE_WINDOW_TOKENS) bucket[token] = false;
    kwsTokenUiState.heardWakeWindowTokensByAxis[a] = bucket;
  }

  function resetHeardWakeWindowTokensAllAxes() {
    resetHeardWakeWindowTokensForAxis("x");
    resetHeardWakeWindowTokensForAxis("y");
    resetHeardWakeWindowTokensForAxis("z");
  }

  function markHeardWakeWindowToken(axis, token) {
    const a = String(axis || "").trim().toLowerCase();
    const t = String(token || "").trim().toLowerCase();
    if (!(a === "x" || a === "y" || a === "z")) return;
    if (!t) return;
    if (!kwsTokenUiState.heardWakeWindowTokensByAxis[a]) resetHeardWakeWindowTokensForAxis(a);
    kwsTokenUiState.heardWakeWindowTokensByAxis[a][t] = true;
  }

  function setActiveSpinAxis(axis) {
    const a = String(axis || "").trim().toLowerCase();
    const next = (a === "x" || a === "y" || a === "z") ? a : "";
    kwsTokenUiState.activeSpinAxis = next;
  }

  function clearActiveSpinState() {
    kwsTokenUiState.activeSpinAxis = "";
    kwsTokenUiState.selectedSpinWordByAxis.x = "";
    kwsTokenUiState.selectedSpinWordByAxis.y = "";
    kwsTokenUiState.selectedSpinWordByAxis.z = "";
    resetHeardWakeWindowTokensAllAxes();
  }

  function setSelectedSpinWord(axis, spinWord) {
    const a = String(axis || "").trim().toLowerCase();
    if (!(a === "x" || a === "y" || a === "z")) return;
    const token = String(spinWord || "").trim().toLowerCase();
    kwsTokenUiState.selectedSpinWordByAxis[a] = token;
  }
  function clearKwsWakeHudGateTimer() {
    if (!kwsWakeHudGateTO) return;
    clearTimeout(kwsWakeHudGateTO);
    kwsWakeHudGateTO = 0;
  }

  function flashKwsToken(token, ms = 360) {
    const t = String(token || "").trim().toLowerCase();
    if (!t) return;
    if (!wordFlashboardPopup.isOpen()) return;
    const until = Date.now() + Math.max(60, Number(ms) || 360);
    kwsTokenUiState.flashUntilMs[t] = until;
    const existing = kwsTokenUiState.flashTOByToken[t];
    if (existing) clearTimeout(existing);
    kwsTokenUiState.flashTOByToken[t] = setTimeout(() => {
      delete kwsTokenUiState.flashTOByToken[t];
      if (Number(kwsTokenUiState.flashUntilMs[t] || 0) <= Date.now()) {
        kwsTokenUiState.flashUntilMs[t] = 0;
      }
      updateKwsReadout();
    }, Math.max(80, until - Date.now()));
  }

  function tokenChipHtml(token, lit, flash) {
    const cls = `kwsTokenChip${lit ? " on" : ""}${flash ? " flash" : ""}`;
    const t = String(token || "");
    return `<span class="${cls}">${t}</span>`;
  }

  function openKwsWakeHudGate(timeoutMs = DEFAULT_KWS_GATE_TIMEOUT_MS) {
    const t = Math.max(250, Number(timeoutMs) || DEFAULT_KWS_GATE_TIMEOUT_MS);
    clearKwsWakeHudGateTimer();
    kwsTokenUiState.orbisWindowUntilMs = Date.now() + t;
    if (typeof onGateOpened === "function") {
      onGateOpened({ reason: "kws_wake_token", timeoutMs: t, atMs: Date.now() });
    }
    kwsWakeHudGateTO = setTimeout(() => {
      kwsWakeHudGateTO = 0;
      kwsTokenUiState.orbisWindowUntilMs = 0;
      if (typeof onGateClosed === "function") {
        onGateClosed({ reason: "kws_timeout", atMs: Date.now() });
      }
      updateKwsReadout();
    }, t);
    updateKwsReadout();
  }

  function startKwsReadoutTick() {
    if (kwsReadoutTickTO) return;
    kwsReadoutTickTO = setInterval(() => {
      updateKwsReadout();
    }, KWS_READOUT_TICK_MS);
  }

  function stopKwsReadoutTick() {
    if (!kwsReadoutTickTO) return;
    clearInterval(kwsReadoutTickTO);
    kwsReadoutTickTO = 0;
  }

  function updateKwsReadout() {
    if (!els.kwsReadout) return;
    const parts = [];
    const listenPolicyStatus = typeof getListenPolicyStatus === "function" ? getListenPolicyStatus() : null;
    const listenPolicyMode = String(listenPolicyStatus && listenPolicyStatus.mode || "").trim().toUpperCase();
    if (listenPolicyMode) parts.push(`lp:${listenPolicyMode}`);
    const kwsWordProvider = readKwsWordProvider();
    if (kwsWordProvider && typeof kwsWordProvider.getStatus === "function") {
      const s = kwsWordProvider.getStatus();
      if (s && s.micError) parts.push(`micerr:${String(s.micError).slice(0, 220)}`);
      const backendStatus = s && s.audioBackendStatus ? s.audioBackendStatus : null;
      if (backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "connected")) {
        parts.push(`conn:${backendStatus.connected ? "on" : "off"}`);
      }
      if (backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "simulated")) {
        parts.push(`mode:${backendStatus.simulated ? "sim" : "real"}`);
      }
      if (backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "modelAssetsLoaded")) {
        const loaded = Number(backendStatus.loadedModelCount) || 0;
        const total = Number(backendStatus.modelCount) || 0;
        parts.push(`mdl:${loaded}/${total}`);
      }
      if (backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "audioWorkerFramesProduced")) {
        const f = Number(backendStatus.audioWorkerFramesProduced) || 0;
        const d = Number(backendStatus.audioWorkerFramesDropped) || 0;
        const ch = Number(backendStatus.audioChunksSent) || 0;
        const q = Number(backendStatus.audioWorkerQueueDepth) || 0;
        const startAt = Number(backendStatus.audioStartAtMs) || 0;
        const ctxState = String(backendStatus.audioContextState || "").trim().toLowerCase();
        if (ctxState) parts.push(`ctx:${ctxState}`);
        parts.push(`aud:${ch}`);
        parts.push(`frm:${f}`);
        parts.push(`q:${q}`);
        if (d > 0) parts.push(`drop:${d}`);
        if (ctxState === "running" && ch === 0 && startAt > 0) {
          const ageMs = Math.max(0, performance.now() - startAt);
          if (ageMs >= DEFAULT_KWS_START_STALL_MS) parts.push("start:stalled");
        }
      }
      if (backendStatus && Object.prototype.hasOwnProperty.call(backendStatus, "inferInferences")) {
        const inf = Number(backendStatus.inferInferences) || 0;
        const score = Number(backendStatus.inferLastScore);
        const infReady = !!backendStatus.inferReady;
        const initStep = String(backendStatus.inferInitStep || "").trim().toLowerCase();
        const thr = Number(backendStatus.inferThreshold);
        parts.push(`inf:${infReady ? "on" : "off"}/${inf}`);
        if (!infReady && initStep) parts.push(`init:${initStep}`);
        if (Number.isFinite(thr)) parts.push(`thr:${thr.toFixed(3)}`);
        if (Number.isFinite(score) && inf > 0) parts.push(`scr:${score.toFixed(3)}`);
      }
      if (backendStatus && backendStatus.lastError) {
        const errText = String(backendStatus.lastError);
        parts.push(`err:${errText.slice(0, 180)}`);
        if (errText && errText !== kwsLastBackendErrorLogged) kwsLastBackendErrorLogged = errText;
      } else {
        kwsLastBackendErrorLogged = "";
      }
    }
    const meta = parts.length ? `<span class="kwsTokenMeta">${parts.join(" | ")}</span>` : "";
    pendingKwsReadoutHtml = meta || "idle";
    if (!wordFlashboardPopup.isOpen()) return;
    els.kwsReadout.innerHTML = pendingKwsReadoutHtml;
    wordFlashboardPopup.render();
  }

  function bindWordBoardPopupButton() {
    wordFlashboardPopup.bind();
  }

  function setManualListenableTokens(tokens = []) {
    manualListenableTokens = new Set(
      (Array.isArray(tokens) ? tokens : [])
        .map((token) => canonicalKwsToken(token))
        .filter(Boolean)
    );
    if (wordFlashboardPopup.isOpen()) {
      wordFlashboardPopup.render();
    }
  }

  function getManualListenableTokens() {
    return Array.from(manualListenableTokens.values());
  }

  function setManualWakeWindowTokens(tokens = []) {
    manualWakeWindowTokens = new Set(
      (Array.isArray(tokens) ? tokens : [])
        .map((token) => canonicalKwsToken(token))
        .filter(Boolean)
    );
    if (wordFlashboardPopup.isOpen()) {
      wordFlashboardPopup.render();
    }
  }

  function getManualWakeWindowTokens() {
    return Array.from(manualWakeWindowTokens.values());
  }

  function refreshWordFlashboard() {
    if (wordFlashboardPopup.isOpen()) {
      wordFlashboardPopup.render();
    }
  }

  function syncKwsTuneUiFromStatus(status) {
    const backend = status && status.audioBackendStatus ? status.audioBackendStatus : status;
    if (!backend || typeof backend !== "object") return;
    if (els.kwsTokenThrInput && Number.isFinite(Number(backend.inferThreshold))) {
      els.kwsTokenThrInput.value = Number(backend.inferThreshold).toFixed(3);
    }
    if (els.kwsCooldownMsInput && Number.isFinite(Number(backend.inferCooldownMs))) {
      els.kwsCooldownMsInput.value = String(Math.round(Number(backend.inferCooldownMs)));
    }
  }

  function applyKwsParserTuneFromUi() {
    if (typeof onApplyTune !== "function") return null;
    const inferThreshold = readNumberInputOrNull(els.kwsTokenThrInput);
    const inferCooldownMs = readNumberInputOrNull(els.kwsCooldownMsInput);
    const status = onApplyTune({
      ...(inferThreshold == null ? {} : { inferThreshold }),
      ...(inferCooldownMs == null ? {} : { inferCooldownMs }),
    });
    syncKwsTuneUiFromStatus(status && status.audioBackendStatus ? status.audioBackendStatus : status);
    return status;
  }

  function bindTuneApplyButton() {
    if (tuneApplyBound) return;
    tuneApplyBound = true;
    if (els.kwsApplyTuneBtn) {
      els.kwsApplyTuneBtn.addEventListener("click", applyKwsParserTuneFromUi);
    }
  }

  resetHeardWakeWindowTokensAllAxes();

  return {
    startKwsReadoutTick,
    stopKwsReadoutTick,
    clearKwsWakeHudGateTimer,
    canonicalKwsToken,
    isWakeWindowActive,
    shouldLogHeardWakeword,
    resetHeardWakeWindowTokensForAxis,
    resetHeardWakeWindowTokensAllAxes,
    markHeardWakeWindowToken,
    setActiveSpinAxis,
    clearActiveSpinState,
    setSelectedSpinWord,
    flashKwsToken,
    openKwsWakeHudGate,
    updateKwsReadout,
    pushGeneralLogLine: logPopupController.pushGeneralLogLine,
    pushKwsLogLine: logPopupController.pushKwsLogLine,
    syncKwsTuneUiFromStatus,
    bindTuneApplyButton,
    bindLogPopupButton: logPopupController.bindLogPopupButton,
    bindWordBoardDebugToggle: logPopupController.bindWordBoardDebugToggle,
    bindWordBoardPopupButton,
    pushPhoneLogLine: logPopupController.pushPhoneLogLine,
    setManualListenableTokens,
    getManualListenableTokens,
    setManualWakeWindowTokens,
    getManualWakeWindowTokens,
    refreshWordFlashboard,
    getUiState: () => kwsTokenUiState,
  };
}
