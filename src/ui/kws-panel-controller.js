export function createKwsPanelController({
  els = {},
  constants = {},
  getKwsVoiceProvider = () => null,
  onGateOpened = null,
  onGateClosed = null,
  onApplyTune = null,
} = {}) {
  const DEFAULT_KWS_GATE_TIMEOUT_MS = Math.max(250, Number(constants.defaultGateTimeoutMs) || 1500);
  const DEFAULT_KWS_START_STALL_MS = Math.max(0, Number(constants.startStallMs) || 8000);
  const KWS_READOUT_TICK_MS = Math.max(100, Number(constants.readoutTickMs) || 250);
  const KWS_EVENT_LOG_MAX = Math.max(1, Number(constants.eventLogMax) || 5);
  const KWS_LOG_DEDUP_MS = Math.max(0, Number(constants.logDedupMs) || 450);
  const KWS_ROW_TOP = Array.isArray(constants.rowTop) ? constants.rowTop.slice() : [];
  const KWS_ROW_BOTTOM = Array.isArray(constants.rowBottom) ? constants.rowBottom.slice() : [];
  const KWS_WAKE_WINDOW_TOKENS = Array.isArray(constants.wakeWindowTokens) ? constants.wakeWindowTokens.slice() : [];
  const KWS_AXIS_TOKENS = Array.isArray(constants.axisTokens) ? constants.axisTokens.slice() : [];
  const KWS_WAKE_TOKENS = Array.isArray(constants.wakeTokens) ? constants.wakeTokens.slice() : [];
  const KWS_WAKE_REQUIRED_TOKENS = Array.isArray(constants.wakeRequiredTokens) ? constants.wakeRequiredTokens.slice() : [];
  const LEGACY_AXIS_TOKEN_BY_AXIS = (constants.axisSpellByAxis && typeof constants.axisSpellByAxis === "object")
    ? constants.axisSpellByAxis
    : null;
  const KWS_EXPECTED_AXIS_TOKEN_BY_AXIS = (constants.expectedAxisTokenByAxis && typeof constants.expectedAxisTokenByAxis === "object")
    ? { ...constants.expectedAxisTokenByAxis }
    : (LEGACY_AXIS_TOKEN_BY_AXIS
      ? { ...LEGACY_AXIS_TOKEN_BY_AXIS }
      : Object.create(null));
  const KWS_LOG_TOKENS = new Set(Array.isArray(constants.logTokens) ? constants.logTokens : []);
  const TEMP_UNGATED_KWS_TOKENS = new Set(Array.isArray(constants.tempUngatedTokens) ? constants.tempUngatedTokens : []);
  const KWS_TOKEN_CANONICAL_MAP = (constants.tokenCanonicalMap && typeof constants.tokenCanonicalMap === "object")
    ? constants.tokenCanonicalMap
    : Object.freeze({});
  const KWS_WAKE_WINDOW_TOKEN_SET = new Set(KWS_WAKE_WINDOW_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const KWS_AXIS_TOKEN_SET = new Set(KWS_AXIS_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const KWS_WAKE_TOKEN_SET = new Set(KWS_WAKE_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));
  const KWS_WAKE_REQUIRED_TOKEN_SET = new Set(KWS_WAKE_REQUIRED_TOKENS.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean));

  const kwsTokenUiState = {
    flatSpinAxis: "",
    selectedAxisSpellByAxis: { x: "", y: "", z: "" },
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
  let tuneApplyBound = false;

  function readNumberInputOrNull(el) {
    if (!el) return null;
    const raw = String(el.value == null ? "" : el.value).trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function expectedAxisTokenForAxis(axis) {
    const a = String(axis || "").trim().toLowerCase();
    return String(KWS_EXPECTED_AXIS_TOKEN_BY_AXIS[a] || "").trim().toLowerCase();
  }

  function canonicalKwsToken(rawToken) {
    const token = String(rawToken || "").trim().toLowerCase();
    if (!token) return "";
    return String(KWS_TOKEN_CANONICAL_MAP[token] || token);
  }

  function isWakeWindowActive() {
    const axis = String(kwsTokenUiState.flatSpinAxis || "").trim().toLowerCase();
    if (!(axis === "x" || axis === "y" || axis === "z")) return false;
    const selectedAxisSpell = String(kwsTokenUiState.selectedAxisSpellByAxis[axis] || "").toLowerCase();
    return KWS_AXIS_TOKEN_SET.has(selectedAxisSpell);
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
      const axis = String(kwsTokenUiState.flatSpinAxis || "").trim().toLowerCase();
      return !!axis && token === expectedAxisTokenForAxis(axis);
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

  function setFlatSpinAxis(axis) {
    const a = String(axis || "").trim().toLowerCase();
    kwsTokenUiState.flatSpinAxis = (a === "x" || a === "y" || a === "z") ? a : "";
  }

  function clearFlatSpinState() {
    kwsTokenUiState.flatSpinAxis = "";
    kwsTokenUiState.selectedAxisSpellByAxis.x = "";
    kwsTokenUiState.selectedAxisSpellByAxis.y = "";
    kwsTokenUiState.selectedAxisSpellByAxis.z = "";
    resetHeardWakeWindowTokensAllAxes();
  }

  function setSelectedAxisSpell(axis, axisSpell) {
    const a = String(axis || "").trim().toLowerCase();
    if (!(a === "x" || a === "y" || a === "z")) return;
    kwsTokenUiState.selectedAxisSpellByAxis[a] = String(axisSpell || "").trim().toLowerCase();
  }

  function clearKwsWakeHudGateTimer() {
    if (!kwsWakeHudGateTO) return;
    clearTimeout(kwsWakeHudGateTO);
    kwsWakeHudGateTO = 0;
  }

  function flashKwsToken(token, ms = 360) {
    const t = String(token || "").trim().toLowerCase();
    if (!t) return;
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
    const now = Date.now();
    const orbisOpen = now < Number(kwsTokenUiState.orbisWindowUntilMs || 0);
    const axis = String(kwsTokenUiState.flatSpinAxis || "").trim().toLowerCase();
    const expectedAxisToken = expectedAxisTokenForAxis(axis);
    const wakeWindowActive = isWakeWindowActive();
    const lineTop = KWS_ROW_TOP.map((token) => {
      const t = String(token || "").trim().toLowerCase();
      let lit = false;
      if (KWS_WAKE_TOKEN_SET.has(t) || KWS_WAKE_REQUIRED_TOKEN_SET.has(t)) lit = orbisOpen;
      else if (KWS_AXIS_TOKEN_SET.has(t)) lit = t === expectedAxisToken;
      const flash = Number(kwsTokenUiState.flashUntilMs[token] || 0) > now;
      return tokenChipHtml(token, lit, flash);
    }).join(" ");
    const lineBottom = KWS_ROW_BOTTOM.map((token) => {
      const heardOnAxis = !!(axis && kwsTokenUiState.heardWakeWindowTokensByAxis[axis] && kwsTokenUiState.heardWakeWindowTokensByAxis[axis][token]);
      const lit = wakeWindowActive && heardOnAxis;
      const flash = Number(kwsTokenUiState.flashUntilMs[token] || 0) > now;
      return tokenChipHtml(token, lit, flash);
    }).join(" ");
    const parts = [];
    const kwsVoiceProvider = getKwsVoiceProvider();
    if (kwsVoiceProvider && typeof kwsVoiceProvider.getStatus === "function") {
      const s = kwsVoiceProvider.getStatus();
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
    els.kwsReadout.innerHTML = `<div class="kwsTokenRow">${lineTop}</div><div class="kwsTokenRow">${lineBottom}</div>${meta}`;
  }

  function renderKwsLog() {
    if (!els.kwsLog) return;
    if (!kwsEventLog.length) {
      els.kwsLog.innerHTML = '<div class="kwsLogLine muted">no kws events yet</div>';
      return;
    }
    els.kwsLog.innerHTML = kwsEventLog.map((row) => {
      const safe = String(row && row.text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const cls = `kwsLogLine${row && row.kind ? ` ${row.kind}` : ""}`;
      return `<div class="${cls}">${safe}</div>`;
    }).join("");
  }

  function pushKwsLogLine(text, kind = "") {
    const line = String(text || "").trim();
    if (!line) return;
    const nowMs = Date.now();
    if (line === kwsLastLogText && (nowMs - Number(kwsLastLogAtMs || 0)) <= KWS_LOG_DEDUP_MS) return;
    kwsLastLogText = line;
    kwsLastLogAtMs = nowMs;
    kwsEventLog.unshift({ text: line, kind: String(kind || "") });
    if (kwsEventLog.length > KWS_EVENT_LOG_MAX) kwsEventLog.length = KWS_EVENT_LOG_MAX;
    renderKwsLog();
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
    setFlatSpinAxis,
    clearFlatSpinState,
    setSelectedAxisSpell,
    flashKwsToken,
    openKwsWakeHudGate,
    updateKwsReadout,
    pushKwsLogLine,
    syncKwsTuneUiFromStatus,
    bindTuneApplyButton,
    getUiState: () => kwsTokenUiState,
  };
}
