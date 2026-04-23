export function createLogPanelController({
  els = {},
  dedupMs = 450,
  preopenBufferLimit = 80,
} = {}) {
  const KWS_LOG_DEDUP_MS = Math.max(0, Number(dedupMs) || 450);
  const KWS_PREOPEN_LOG_BUFFER_LIMIT = Math.max(10, Number(preopenBufferLimit) || 80);
  const PATH_BOARD_DEBUG_LIMIT = 18;
  const kwsEventLog = [];
  let kwsLastLogText = "";
  let kwsLastLogAtMs = 0;
  let kwsLogStartedAtMs = 0;
  let logPanelOpen = false;
  let logPanelDrag = null;
  let boundLogPanelRoot = null;
  let pathBoardDebugOpen = false;
  let pathBoardDebugBound = false;
  let pathBoardVisible = false;
  let activeLogChannel = "general";
  let managedPanelHooksRegistered = false;
  const pathBoardDebugRows = [];
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

  function shouldAutoOpenPathBoardDebug(line, kind = "") {
    const text = String(line || "").trim();
    const normalizedKind = String(kind || "").trim().toLowerCase();
    return normalizedKind === "bad" || /(^|[\s:_-])(error|failed|fatal)([\s:_-]|$)/i.test(text);
  }

  function appendPathBoardDebugRow(row) {
    if (!row) return;
    pathBoardDebugRows.push(row);
    while (pathBoardDebugRows.length > PATH_BOARD_DEBUG_LIMIT) pathBoardDebugRows.shift();
    if (pathBoardVisible && pathBoardDebugOpen) renderPathBoardDebugBody();
  }

  function renderPathBoardDebugBody() {
    if (!els.pathBoardDebugBody) return;
    els.pathBoardDebugBody.textContent = "";
    for (const row of pathBoardDebugRows) {
      const lineEl = document.createElement("div");
      lineEl.className = `pathBoardDebugLine${row.kind ? ` ${row.kind}` : ""}`;
      lineEl.textContent = String(row.text || "");
      els.pathBoardDebugBody.appendChild(lineEl);
    }
    els.pathBoardDebugBody.scrollTop = els.pathBoardDebugBody.scrollHeight;
  }

  function renderPathBoardDebugBadge() {
    if (!pathBoardVisible || !els.pathBoardDebugBadge) return;
    const lastRow = pathBoardDebugRows[pathBoardDebugRows.length - 1] || null;
    const badge = els.pathBoardDebugBadge;
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
    badge.textContent = `${pathBoardDebugRows.length} lines`;
    badge.classList.add("hot");
  }

  function setPathBoardDebugOpen(nextOpen) {
    pathBoardDebugOpen = !!nextOpen;
    if (els.pathBoardDebugPanel) els.pathBoardDebugPanel.classList.toggle("on", pathBoardDebugOpen);
    if (els.pathBoardDebugToggle) els.pathBoardDebugToggle.setAttribute("aria-expanded", pathBoardDebugOpen ? "true" : "false");
    if (els.pathBoardDebugBody) els.pathBoardDebugBody.setAttribute("aria-hidden", pathBoardDebugOpen ? "false" : "true");
    if (!pathBoardVisible || !pathBoardDebugOpen) {
      if (els.pathBoardDebugBody) els.pathBoardDebugBody.textContent = "";
      return;
    }
    renderPathBoardDebugBody();
  }

  function bindPathBoardDebugToggle() {
    if (pathBoardDebugBound) return;
    pathBoardDebugBound = true;
    if (els.pathBoardDebugToggle) {
      els.pathBoardDebugToggle.addEventListener("click", () => {
        setPathBoardDebugOpen(!pathBoardDebugOpen);
      });
    }
  }

  function setPathBoardVisible(nextVisible) {
    pathBoardVisible = !!nextVisible;
    if (!pathBoardVisible) {
      if (els.pathBoardDebugBody) els.pathBoardDebugBody.textContent = "";
      return;
    }
    renderPathBoardDebugBadge();
    if (pathBoardDebugOpen) renderPathBoardDebugBody();
  }

  function renderCurrentLogChannel() {
    if (!els.kwsLog) return;
    els.kwsLog.textContent = "";
    const state = logChannelState[activeLogChannel];
    if (!state || !state.rows.length) {
      const lineEl = document.createElement("div");
      lineEl.className = "kwsLogLine muted";
      lineEl.textContent = activeLogChannel === "general"
        ? "...no traces running"
        : (activeLogChannel === "phone" ? "No phone log lines yet." : "No KWS log lines yet.");
      els.kwsLog.appendChild(lineEl);
      return;
    }
    for (const row of state.rows) appendKwsLogRow(row);
  }

  function appendLiveRowIfActive(channel, row) {
    if (!row || !logPanelOpen) return;
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
    if (els.logPanelTabs) {
      els.logPanelTabs.dataset.activeChannel = activeLogChannel;
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
      tab.el.dataset.active = active ? "true" : "false";
      tab.el.classList.toggle("on", active);
    }
  }

  function setActiveLogChannel(nextChannel) {
    const next = String(nextChannel || "").trim().toLowerCase();
    activeLogChannel = next === "phone" ? "phone" : (next === "kws" ? "kws" : "general");
    renderLogChannelTabs();
    renderCurrentLogChannel();
  }

  function setLogPanelOpen(nextOpen) {
    logPanelOpen = !!nextOpen;
    if (els.logPanel) {
      els.logPanel.setAttribute("aria-hidden", logPanelOpen ? "false" : "true");
      els.logPanel.classList.toggle("on", logPanelOpen);
    }
    if (!logPanelOpen) {
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

  function beginLogPanelDrag(ev) {
    if (!els.logPanel || !els.logPanelHeader) return;
    if (ev.target && typeof ev.target.closest === "function" && ev.target.closest("button")) return;
    const rect = els.logPanel.getBoundingClientRect();
    logPanelDrag = {
      pointerId: ev.pointerId,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
    };
    try { els.logPanelHeader.setPointerCapture(ev.pointerId); } catch (_) {}
    ev.preventDefault();
  }

  function moveLogPanelDrag(ev) {
    if (!logPanelDrag || !els.logPanel) return;
    const maxLeft = Math.max(0, window.innerWidth - els.logPanel.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - els.logPanel.offsetHeight);
    const left = Math.max(0, Math.min(maxLeft, ev.clientX - logPanelDrag.offsetX));
    const top = Math.max(0, Math.min(maxTop, ev.clientY - logPanelDrag.offsetY));
    els.logPanel.style.left = `${left}px`;
    els.logPanel.style.top = `${top}px`;
  }

  function endLogPanelDrag() {
    if (!logPanelDrag || !els.logPanelHeader) return;
    try { els.logPanelHeader.releasePointerCapture(logPanelDrag.pointerId); } catch (_) {}
    logPanelDrag = null;
  }

  function bindLogPanel() {
    if (!els.logPanel || boundLogPanelRoot === els.logPanel) return;
    boundLogPanelRoot = els.logPanel;

    if (els.logPanelClose) {
      els.logPanelClose.addEventListener("click", () => {
        const panelManager = els.devPanelManager;
        if (panelManager && typeof panelManager.closePanel === "function") {
          panelManager.closePanel("log");
          return;
        }
        setLogPanelOpen(false);
      });
    }
    const bindLogTab = (el, channel) => {
      if (!el) return;
      let pointerActivated = false;
      el.addEventListener("pointerdown", (ev) => {
        pointerActivated = true;
        ev.preventDefault();
        setActiveLogChannel(channel);
      });
      el.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (pointerActivated) {
          pointerActivated = false;
          return;
        }
        setActiveLogChannel(channel);
      });
    };
    bindLogTab(els.logTabGeneral, "general");
    bindLogTab(els.logTabKws, "kws");
    bindLogTab(els.logTabPhone, "phone");
    if (els.logPanelHeader && !(els.devPanelManager && typeof els.devPanelManager.isOpen === "function")) {
      els.logPanelHeader.addEventListener("pointerdown", beginLogPanelDrag);
      els.logPanelHeader.addEventListener("pointermove", moveLogPanelDrag);
      els.logPanelHeader.addEventListener("pointerup", endLogPanelDrag);
      els.logPanelHeader.addEventListener("pointercancel", endLogPanelDrag);
    }
  }

  function registerManagedPanelHooks() {
    if (managedPanelHooksRegistered) return;
    const panelManager = els.devPanelManager;
    if (!panelManager || typeof panelManager.registerPanelHooks !== "function") return;
    managedPanelHooksRegistered = true;
    panelManager.registerPanelHooks("log", {
      onMount() {
        bindLogPanel();
        setLogPanelOpen(true);
      },
      onBeforeClose() {
        setLogPanelOpen(false);
        boundLogPanelRoot = null;
      },
    });
  }

  registerManagedPanelHooks();

  function pushKwsLogLine(text, kind = "") {
    const line = String(text || "").trim();
    if (!line) return;
    const row = logPanelOpen
      ? appendLogRowToState(logChannelState.kws, line, kind)
      : appendLogRowToState(preopenLogChannelState.kws, line, kind, KWS_PREOPEN_LOG_BUFFER_LIMIT);
    if (!row) return;
    appendPathBoardDebugRow(row);
    if (pathBoardVisible) renderPathBoardDebugBadge();
    if (shouldAutoOpenPathBoardDebug(line, kind)) setPathBoardDebugOpen(true);
    if (!logPanelOpen) return;
    syncLegacyKwsLogState();
    appendLiveRowIfActive("kws", row);
  }

  function pushGeneralLogLine(text, kind = "") {
    const line = String(text || "").trim();
    if (!line) return;
    if (!logPanelOpen) {
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
    if (!logPanelOpen) {
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
    bindPathBoardDebugToggle,
    setPathBoardVisible,
  };
}
