import { createWordFlashboardPopup } from "./word-flashboard-popup.js";

export function createKwsPanelController({
  els = {},
  constants = {},
  getKwsWordProvider = null,
  getKwsVoiceProvider = () => null,
  onGateOpened = null,
  onGateClosed = null,
  onApplyTune = null,
  onToggleListenPolicyMode = null,
  getListenPolicyStatus = null,
} = {}) {
  const DEFAULT_KWS_GATE_TIMEOUT_MS = Math.max(250, Number(constants.defaultGateTimeoutMs) || 1500);
  const DEFAULT_KWS_START_STALL_MS = Math.max(0, Number(constants.startStallMs) || 8000);
  const KWS_READOUT_TICK_MS = Math.max(100, Number(constants.readoutTickMs) || 250);
  const KWS_LOG_DEDUP_MS = Math.max(0, Number(constants.logDedupMs) || 450);
  const WORDFLASHBOARD_WORDS = Array.isArray(constants.wordFlashboardWords)
    ? constants.wordFlashboardWords.map((entry) => Object.freeze({ ...entry }))
    : [];
  const KWS_ROW_TOP = Array.isArray(constants.rowTop) ? constants.rowTop.slice() : [];
  const KWS_ROW_BOTTOM = Array.isArray(constants.rowBottom) ? constants.rowBottom.slice() : [];
  const KWS_WAKE_WINDOW_TOKENS = Array.isArray(constants.wakeWindowTokens) ? constants.wakeWindowTokens.slice() : [];
  const KWS_AXIS_TOKENS = Array.isArray(constants.axisTokens) ? constants.axisTokens.slice() : [];
  const KWS_WAKE_TOKENS = Array.isArray(constants.wakeTokens) ? constants.wakeTokens.slice() : [];
  const KWS_WAKE_REQUIRED_TOKENS = Array.isArray(constants.wakeRequiredTokens) ? constants.wakeRequiredTokens.slice() : [];
  const KWS_AXIS_WORD_BY_AXIS = (constants.axisWordByAxis && typeof constants.axisWordByAxis === "object")
    ? { ...constants.axisWordByAxis }
    : (constants.axisSpellByAxis && typeof constants.axisSpellByAxis === "object")
    ? { ...constants.axisSpellByAxis }
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
  let kwsWakeHudGateTO = 0;
  let kwsReadoutTickTO = 0;
  let kwsLastBackendErrorLogged = "";
  const kwsEventLog = [];
  let kwsLastLogText = "";
  let kwsLastLogAtMs = 0;
  let kwsLogStartedAtMs = 0;
  let logPopupBound = false;
  let logPopupOpen = false;
  let logPopupDrag = null;
  let activeLogChannel = "kws";
  const logChannelState = {
    kws: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
    phone: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
  };
  let tuneApplyBound = false;
  let listenPolicyBound = false;
  const wordFlashboardPopup = createWordFlashboardPopup({
    els,
    words: WORDFLASHBOARD_WORDS,
    canonicalToken: canonicalKwsToken,
    getListenableTokens: () => {
      const status = typeof getListenPolicyStatus === "function" ? getListenPolicyStatus() : null;
      return new Set(
        (Array.isArray(status && status.listenableTokens) ? status.listenableTokens : [])
          .map((token) => canonicalKwsToken(token))
          .filter(Boolean)
      );
    },
    getFlashUntilMs: (token) => Number(kwsTokenUiState.flashUntilMs[String(token || "").trim().toLowerCase()] || 0),
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
    return String(KWS_AXIS_WORD_BY_AXIS[a] || "").trim().toLowerCase();
  }
  const expectedAxisSpellForAxis = expectedAxisWordForAxis;

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

  function setSelectedSpinWord(axis, axisWord) {
    const a = String(axis || "").trim().toLowerCase();
    if (!(a === "x" || a === "y" || a === "z")) return;
    const token = String(axisWord || "").trim().toLowerCase();
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
    renderListenPolicyMode();
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
    els.kwsReadout.innerHTML = meta || "idle";
    wordFlashboardPopup.render();
  }

  function syncLegacyKwsLogState() {
    const state = logChannelState.kws;
    kwsEventLog.length = 0;
    kwsEventLog.push(...state.rows);
    kwsLastLogText = state.lastText;
    kwsLastLogAtMs = state.lastAtMs;
    kwsLogStartedAtMs = state.startedAtMs;
  }

  function clearLogChannelBuffer(channel) {
    const key = String(channel || "").trim().toLowerCase();
    const state = logChannelState[key];
    if (!state) return;
    state.rows.length = 0;
    state.lastText = "";
    state.lastAtMs = 0;
    state.startedAtMs = 0;
    if (key === "kws") syncLegacyKwsLogState();
  }

  function clearAllLogBuffers() {
    clearLogChannelBuffer("kws");
    clearLogChannelBuffer("phone");
    if (els.kwsLog) els.kwsLog.textContent = "";
  }

  function appendKwsLogRow(row) {
    if (!els.kwsLog || !row) return;
    const lineEl = document.createElement("div");
    lineEl.className = `kwsLogLine${row.kind ? ` ${row.kind}` : ""}`;
    lineEl.textContent = String(row.text || "");
    els.kwsLog.appendChild(lineEl);
    els.kwsLog.scrollTop = els.kwsLog.scrollHeight;
  }

  function renderCurrentLogChannel() {
    if (!els.kwsLog) return;
    els.kwsLog.textContent = "";
    const state = logChannelState[activeLogChannel];
    if (!state || !state.rows.length) return;
    for (const row of state.rows) appendKwsLogRow(row);
  }

  function renderLogChannelTabs() {
    if (els.logTabKws) els.logTabKws.classList.toggle("active", activeLogChannel === "kws");
    if (els.logTabPhone) els.logTabPhone.classList.toggle("active", activeLogChannel === "phone");
  }

  function setActiveLogChannel(nextChannel) {
    const next = String(nextChannel || "").trim().toLowerCase();
    activeLogChannel = next === "phone" ? "phone" : "kws";
    renderLogChannelTabs();
    renderCurrentLogChannel();
  }

  function setLogPopupOpen(nextOpen) {
    logPopupOpen = !!nextOpen;
    if (els.logPopup) {
      els.logPopup.classList.toggle("on", logPopupOpen);
      els.logPopup.setAttribute("aria-hidden", logPopupOpen ? "false" : "true");
    }
    if (!logPopupOpen) {
      clearAllLogBuffers();
    } else {
      renderLogChannelTabs();
      renderCurrentLogChannel();
    }
  }

  function bindWordBoardPopupButton() {
    wordFlashboardPopup.bind();
  }

  function beginLogPopupDrag(ev) {
    if (!els.logPopup || !els.logPopupHeader) return;
    if (ev.target && typeof ev.target.closest === "function" && ev.target.closest("button")) return;
    const rect = els.logPopup.getBoundingClientRect();
    logPopupDrag = {
      pointerId: ev.pointerId,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
    };
    try { els.logPopupHeader.setPointerCapture(ev.pointerId); } catch (_) {}
    ev.preventDefault();
  }

  function moveLogPopupDrag(ev) {
    if (!logPopupDrag || !els.logPopup) return;
    const maxLeft = Math.max(0, window.innerWidth - els.logPopup.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - els.logPopup.offsetHeight);
    const left = Math.max(0, Math.min(maxLeft, ev.clientX - logPopupDrag.offsetX));
    const top = Math.max(0, Math.min(maxTop, ev.clientY - logPopupDrag.offsetY));
    els.logPopup.style.left = `${left}px`;
    els.logPopup.style.top = `${top}px`;
  }

  function endLogPopupDrag(ev) {
    if (!logPopupDrag || !els.logPopupHeader) return;
    try { els.logPopupHeader.releasePointerCapture(logPopupDrag.pointerId); } catch (_) {}
    logPopupDrag = null;
  }

  function bindLogPopupButton() {
    if (logPopupBound) return;
    logPopupBound = true;
    if (els.teleBtn) {
      els.teleBtn.addEventListener("click", () => {
        setLogPopupOpen(!logPopupOpen);
      });
    }
    if (els.logPopupClose) {
      els.logPopupClose.addEventListener("click", () => setLogPopupOpen(false));
    }
    if (els.logTabKws) {
      els.logTabKws.addEventListener("click", () => setActiveLogChannel("kws"));
    }
    if (els.logTabPhone) {
      els.logTabPhone.addEventListener("click", () => setActiveLogChannel("phone"));
    }
    if (els.logPopupHeader) {
      els.logPopupHeader.addEventListener("pointerdown", beginLogPopupDrag);
      els.logPopupHeader.addEventListener("pointermove", moveLogPopupDrag);
      els.logPopupHeader.addEventListener("pointerup", endLogPopupDrag);
      els.logPopupHeader.addEventListener("pointercancel", endLogPopupDrag);
    }
  }

  function pushKwsLogLine(text, kind = "") {
    if (!logPopupOpen || activeLogChannel !== "kws") return;
    const line = String(text || "").trim();
    if (!line) return;
    const nowMs = Date.now();
    const state = logChannelState.kws;
    if (!state.startedAtMs) state.startedAtMs = nowMs;
    if (line === state.lastText && (nowMs - Number(state.lastAtMs || 0)) <= KWS_LOG_DEDUP_MS) return;
    state.lastText = line;
    state.lastAtMs = nowMs;
    const relMs = Math.max(0, nowMs - state.startedAtMs);
    const stamp = `[${(relMs / 1000).toFixed(3)}]`;
    const row = { text: `${stamp} ${line}`, kind: String(kind || "") };
    state.rows.push(row);
    syncLegacyKwsLogState();
    appendKwsLogRow(row);
  }

  function pushPhoneLogLine(text, kind = "") {
    if (!logPopupOpen || activeLogChannel !== "phone") return;
    const line = String(text || "").trim();
    if (!line) return;
    const nowMs = Date.now();
    const state = logChannelState.phone;
    if (!state.startedAtMs) state.startedAtMs = nowMs;
    if (line === state.lastText && (nowMs - Number(state.lastAtMs || 0)) <= KWS_LOG_DEDUP_MS) return;
    state.lastText = line;
    state.lastAtMs = nowMs;
    const relMs = Math.max(0, nowMs - state.startedAtMs);
    const stamp = `[${(relMs / 1000).toFixed(3)}]`;
    const row = { text: `${stamp} ${line}`, kind: String(kind || "") };
    state.rows.push(row);
    appendKwsLogRow(row);
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

  function renderListenPolicyMode(statusOverride = null) {
    if (!els.kwsListenPolicyBtn) return;
    const status = statusOverride || (typeof getListenPolicyStatus === "function" ? getListenPolicyStatus() : null);
    const mode = String(status && status.mode || "B").trim().toUpperCase() || "B";
    els.kwsListenPolicyBtn.textContent = `Mode ${mode}`;
    els.kwsListenPolicyBtn.dataset.mode = mode;
  }

  function toggleListenPolicyModeFromUi() {
    if (typeof onToggleListenPolicyMode !== "function") return null;
    const status = onToggleListenPolicyMode();
    renderListenPolicyMode(status);
    return status;
  }

  function bindTuneApplyButton() {
    if (tuneApplyBound) return;
    tuneApplyBound = true;
    if (els.kwsApplyTuneBtn) {
      els.kwsApplyTuneBtn.addEventListener("click", applyKwsParserTuneFromUi);
    }
  }

  function bindListenPolicyButton() {
    if (listenPolicyBound) return;
    listenPolicyBound = true;
    if (els.kwsListenPolicyBtn) {
      els.kwsListenPolicyBtn.addEventListener("click", toggleListenPolicyModeFromUi);
      renderListenPolicyMode();
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
    pushKwsLogLine,
    syncKwsTuneUiFromStatus,
    bindTuneApplyButton,
    bindListenPolicyButton,
    bindLogPopupButton,
    bindWordBoardPopupButton,
    renderListenPolicyMode,
    pushPhoneLogLine,
    getUiState: () => kwsTokenUiState,
  };
}
