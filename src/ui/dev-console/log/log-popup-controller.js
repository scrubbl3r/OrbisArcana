export function createLogPopupController({
  els = {},
  dedupMs = 450,
  preopenBufferLimit = 80,
} = {}) {
  const KWS_LOG_DEDUP_MS = Math.max(0, Number(dedupMs) || 450);
  const KWS_PREOPEN_LOG_BUFFER_LIMIT = Math.max(10, Number(preopenBufferLimit) || 80);
  const WORDBOARD_DEBUG_LIMIT = 18;
  const kwsEventLog = [];
  let kwsLastLogText = "";
  let kwsLastLogAtMs = 0;
  let kwsLogStartedAtMs = 0;
  let logPopupBound = false;
  let logPopupOpen = false;
  let logPopupDrag = null;
  let wordBoardDebugOpen = false;
  let wordBoardDebugBound = false;
  let wordBoardVisible = false;
  let activeLogChannel = "general";
  const wordBoardDebugRows = [];
  const logChannelState = {
    general: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
    kws: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
    phone: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
  };
  const preopenLogChannelState = {
    general: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
    kws: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
    phone: { rows: [], lastText: "", lastAtMs: 0, startedAtMs: 0 },
  };

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
    clearLogChannelBuffer("general");
    clearLogChannelBuffer("kws");
    clearLogChannelBuffer("phone");
    if (els.kwsLog) els.kwsLog.textContent = "";
  }

  function clearPreopenLogChannelBuffer(channel) {
    const key = String(channel || "").trim().toLowerCase();
    const state = preopenLogChannelState[key];
    if (!state) return;
    state.rows.length = 0;
    state.lastText = "";
    state.lastAtMs = 0;
    state.startedAtMs = 0;
  }

  function clearAllPreopenLogBuffers() {
    clearPreopenLogChannelBuffer("general");
    clearPreopenLogChannelBuffer("kws");
    clearPreopenLogChannelBuffer("phone");
  }

  function appendKwsLogRow(row) {
    if (!els.kwsLog || !row) return;
    const lineEl = document.createElement("div");
    lineEl.className = `kwsLogLine${row.kind ? ` ${row.kind}` : ""}`;
    lineEl.textContent = String(row.text || "");
    els.kwsLog.appendChild(lineEl);
    els.kwsLog.scrollTop = els.kwsLog.scrollHeight;
  }

  function shouldAutoOpenWordBoardDebug(line, kind = "") {
    const text = String(line || "").trim();
    const normalizedKind = String(kind || "").trim().toLowerCase();
    return normalizedKind === "bad" || /(^|[\s:_-])(error|failed|fatal)([\s:_-]|$)/i.test(text);
  }

  function appendWordBoardDebugRow(row) {
    if (!row) return;
    wordBoardDebugRows.push(row);
    while (wordBoardDebugRows.length > WORDBOARD_DEBUG_LIMIT) wordBoardDebugRows.shift();
    if (wordBoardVisible && wordBoardDebugOpen) renderWordBoardDebugBody();
  }

  function renderWordBoardDebugBody() {
    if (!els.wordBoardDebugBody) return;
    els.wordBoardDebugBody.textContent = "";
    for (const row of wordBoardDebugRows) {
      const lineEl = document.createElement("div");
      lineEl.className = `wordBoardDebugLine${row.kind ? ` ${row.kind}` : ""}`;
      lineEl.textContent = String(row.text || "");
      els.wordBoardDebugBody.appendChild(lineEl);
    }
    els.wordBoardDebugBody.scrollTop = els.wordBoardDebugBody.scrollHeight;
  }

  function renderWordBoardDebugBadge() {
    if (!wordBoardVisible || !els.wordBoardDebugBadge) return;
    const lastRow = wordBoardDebugRows[wordBoardDebugRows.length - 1] || null;
    const badge = els.wordBoardDebugBadge;
    badge.classList.remove("hot", "bad");
    if (!lastRow) {
      badge.textContent = "idle";
      return;
    }
    if (String(lastRow.kind || "").trim().toLowerCase() === "bad") {
      badge.textContent = "error";
      badge.classList.add("bad");
      return;
    }
    badge.textContent = `${wordBoardDebugRows.length} lines`;
    badge.classList.add("hot");
  }

  function setWordBoardDebugOpen(nextOpen) {
    wordBoardDebugOpen = !!nextOpen;
    if (els.wordBoardDebugPanel) els.wordBoardDebugPanel.classList.toggle("on", wordBoardDebugOpen);
    if (els.wordBoardDebugToggle) els.wordBoardDebugToggle.setAttribute("aria-expanded", wordBoardDebugOpen ? "true" : "false");
    if (els.wordBoardDebugBody) els.wordBoardDebugBody.setAttribute("aria-hidden", wordBoardDebugOpen ? "false" : "true");
    if (!wordBoardVisible || !wordBoardDebugOpen) {
      if (els.wordBoardDebugBody) els.wordBoardDebugBody.textContent = "";
      return;
    }
    renderWordBoardDebugBody();
  }

  function bindWordBoardDebugToggle() {
    if (wordBoardDebugBound) return;
    wordBoardDebugBound = true;
    if (els.wordBoardDebugToggle) {
      els.wordBoardDebugToggle.addEventListener("click", () => {
        setWordBoardDebugOpen(!wordBoardDebugOpen);
      });
    }
  }

  function setWordBoardVisible(nextVisible) {
    wordBoardVisible = !!nextVisible;
    if (!wordBoardVisible) {
      if (els.wordBoardDebugBody) els.wordBoardDebugBody.textContent = "";
      return;
    }
    renderWordBoardDebugBadge();
    if (wordBoardDebugOpen) renderWordBoardDebugBody();
  }

  function renderCurrentLogChannel() {
    if (!els.kwsLog) return;
    els.kwsLog.textContent = "";
    const state = logChannelState[activeLogChannel];
    if (!state || !state.rows.length) return;
    for (const row of state.rows) appendKwsLogRow(row);
  }

  function appendLiveRowIfActive(channel, row) {
    if (!row || !logPopupOpen) return;
    if (String(channel || "").trim().toLowerCase() !== activeLogChannel) return;
    appendKwsLogRow(row);
  }

  function appendLogRowToState(state, line, kind = "", limit = Number.POSITIVE_INFINITY) {
    if (!state) return null;
    const text = String(line || "").trim();
    if (!text) return null;
    const nowMs = Date.now();
    if (!state.startedAtMs) state.startedAtMs = nowMs;
    if (text === state.lastText && (nowMs - Number(state.lastAtMs || 0)) <= KWS_LOG_DEDUP_MS) return null;
    state.lastText = text;
    state.lastAtMs = nowMs;
    const relMs = Math.max(0, nowMs - state.startedAtMs);
    const stamp = `[${(relMs / 1000).toFixed(3)}]`;
    const row = { text: `${stamp} ${text}`, kind: String(kind || "") };
    state.rows.push(row);
    while (state.rows.length > limit) state.rows.shift();
    return row;
  }

  function seedLiveLogChannelFromPreopen(channel) {
    const key = String(channel || "").trim().toLowerCase();
    const live = logChannelState[key];
    const preopen = preopenLogChannelState[key];
    if (!live || !preopen || !preopen.rows.length || live.rows.length) return;
    live.rows.push(...preopen.rows);
    live.lastText = preopen.lastText;
    live.lastAtMs = preopen.lastAtMs;
    live.startedAtMs = preopen.startedAtMs;
    if (key === "kws") syncLegacyKwsLogState();
  }

  function renderLogChannelTabs() {
    if (els.logPopupTabs) {
      els.logPopupTabs.dataset.activeChannel = activeLogChannel;
    }
    const tabs = [
      { el: els.logTabGeneral, key: "general" },
      { el: els.logTabKws, key: "kws" },
      { el: els.logTabPhone, key: "phone" },
    ];
    for (const tab of tabs) {
      if (!tab.el) continue;
      const active = activeLogChannel === tab.key;
      tab.el.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function setActiveLogChannel(nextChannel) {
    const next = String(nextChannel || "").trim().toLowerCase();
    activeLogChannel = next === "phone" ? "phone" : (next === "kws" ? "kws" : "general");
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
      seedLiveLogChannelFromPreopen("general");
      seedLiveLogChannelFromPreopen("kws");
      seedLiveLogChannelFromPreopen("phone");
      renderLogChannelTabs();
      renderCurrentLogChannel();
      clearAllPreopenLogBuffers();
    }
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

  function endLogPopupDrag() {
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
    if (els.logTabGeneral) {
      els.logTabGeneral.addEventListener("click", () => setActiveLogChannel("general"));
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
    const line = String(text || "").trim();
    if (!line) return;
    const row = logPopupOpen
      ? appendLogRowToState(logChannelState.kws, line, kind)
      : appendLogRowToState(preopenLogChannelState.kws, line, kind, KWS_PREOPEN_LOG_BUFFER_LIMIT);
    if (!row) return;
    appendWordBoardDebugRow(row);
    if (wordBoardVisible) renderWordBoardDebugBadge();
    if (shouldAutoOpenWordBoardDebug(line, kind)) setWordBoardDebugOpen(true);
    if (!logPopupOpen) return;
    syncLegacyKwsLogState();
    appendLiveRowIfActive("kws", row);
  }

  function pushGeneralLogLine(text, kind = "") {
    const line = String(text || "").trim();
    if (!line) return;
    if (!logPopupOpen) {
      appendLogRowToState(preopenLogChannelState.general, line, kind, KWS_PREOPEN_LOG_BUFFER_LIMIT);
      return;
    }
    const row = appendLogRowToState(logChannelState.general, line, kind);
    if (!row) return;
    appendLiveRowIfActive("general", row);
  }

  function pushPhoneLogLine(text, kind = "") {
    const line = String(text || "").trim();
    if (!line) return;
    if (!logPopupOpen) {
      appendLogRowToState(preopenLogChannelState.phone, line, kind, KWS_PREOPEN_LOG_BUFFER_LIMIT);
      return;
    }
    const row = appendLogRowToState(logChannelState.phone, line, kind);
    if (!row) return;
    appendLiveRowIfActive("phone", row);
  }

  return {
    pushGeneralLogLine,
    pushKwsLogLine,
    pushPhoneLogLine,
    bindLogPopupButton,
    bindWordBoardDebugToggle,
    setWordBoardVisible,
  };
}
