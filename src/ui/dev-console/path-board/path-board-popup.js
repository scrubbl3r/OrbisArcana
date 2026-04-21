export function createPathBoardPopup({
  els = {},
  words = [],
  trailRows = [],
  canonicalToken = (token) => String(token || "").trim().toLowerCase(),
  getListenableTokens = () => new Set(),
  getFlashUntilMs = () => 0,
  getTrailStepState = () => ({ lit: false, flash: false }),
  onVisibilityChanged = null,
} = {}) {
  const pathBoardWords = Array.isArray(words)
    ? words.map((entry) => Object.freeze({ ...entry }))
    : [];
  const pathBoardTrailRows = Array.isArray(trailRows)
    ? trailRows.map((row) => Object.freeze({
      ...row,
      steps: Object.freeze((Array.isArray(row && row.steps) ? row.steps : []).map((entry) => Object.freeze({ ...entry }))),
    }))
    : [];
  let bound = false;
  let triggerBound = false;
  let open = false;
  let drag = null;
  let boundPathBoardRoot = null;
  let managedPanelHooksRegistered = false;

  function pathBoardChipHtml(displayText, lit, flash, kind = "word") {
    const cls = `pathBoardChip${lit ? " on" : ""}${flash ? " flash" : ""}${kind === "signal" ? " signal" : ""}`;
    return `<div class="${cls}">${String(displayText || "")}</div>`;
  }

  function groupWordsByTier(words = []) {
    const rowsByTier = new Map();
    for (const entry of Array.isArray(words) ? words : []) {
      const tier = Math.max(1, Number(entry && entry.tier) || 1);
      const row = rowsByTier.get(tier) || [];
      row.push(entry);
      rowsByTier.set(tier, row);
    }
    return Array.from(rowsByTier.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => row);
  }

  function render() {
    if (!open || !els.pathBoardBody) return;
    const now = Date.now();
    const listenableTokens = getListenableTokens() instanceof Set ? getListenableTokens() : new Set();
    const html = pathBoardTrailRows.length
      ? (() => {
        const groups = [];
        let currentGroup = null;
        for (const row of pathBoardTrailRows) {
          const firstStep = Array.isArray(row && row.steps) && row.steps.length ? row.steps[0] : null;
          const groupKey = `${String(firstStep && firstStep.kind || "").trim().toLowerCase()}:${String(firstStep && firstStep.id || "").trim().toLowerCase()}`;
          if (!currentGroup || currentGroup.key !== groupKey) {
            currentGroup = { key: groupKey, rows: [] };
            groups.push(currentGroup);
          }
          currentGroup.rows.push(row);
        }
        return groups.map((group) => {
          const rowsHtml = group.rows.map((row) => {
            const stepsHtml = (Array.isArray(row && row.steps) ? row.steps : []).map((step, index) => {
              const state = (typeof getTrailStepState === "function" ? getTrailStepState(step) : null) || {};
              const displayText = String(step && step.displayText || step && step.label || step && step.phrase || step && step.id || "");
              const chipHtml = pathBoardChipHtml(displayText, !!state.lit, !!state.flash, String(step && step.kind || "word"));
              if (index <= 0) return chipHtml;
              return `<div class="pathBoardTrailSep">&gt;</div>${chipHtml}`;
            }).join("");
            return `<div class="pathBoardTierRow pathBoardTrailRow">${stepsHtml}</div>`;
          }).join("");
          return `<div class="pathBoardTrailGroup">${rowsHtml}</div>`;
        }).join("");
      })()
      : groupWordsByTier(pathBoardWords)
        .map((row) => {
          const rowHtml = row.map((entry) => {
            const phrase = canonicalToken(entry && entry.phrase);
            const lit = listenableTokens.has(phrase);
            const flash = Number(getFlashUntilMs(phrase) || 0) > now;
            const displayText = String(entry && entry.displayText || entry && entry.label || entry && entry.phrase || entry && entry.id || "");
            return pathBoardChipHtml(displayText, lit, flash);
          }).join("");
          return `<div class="pathBoardTierRow">${rowHtml}</div>`;
        })
        .join("");
    els.pathBoardBody.innerHTML = html;
  }

  function setOpen(nextOpen) {
    open = !!nextOpen;
    if (els.pathBoardPopup) {
      els.pathBoardPopup.setAttribute("aria-hidden", open ? "false" : "true");
      els.pathBoardPopup.classList.toggle("on", open);
    }
    if (!open) {
      if (els.pathBoardBody) els.pathBoardBody.textContent = "";
      if (typeof onVisibilityChanged === "function") onVisibilityChanged(false);
      return;
    }
    if (typeof onVisibilityChanged === "function") onVisibilityChanged(true);
    render();
  }

  function beginDrag(ev) {
    if (!els.pathBoardPopup || !els.pathBoardPopupHeader) return;
    if (ev.target && typeof ev.target.closest === "function" && ev.target.closest("button")) return;
    const rect = els.pathBoardPopup.getBoundingClientRect();
    drag = {
      pointerId: ev.pointerId,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
    };
    try { els.pathBoardPopupHeader.setPointerCapture(ev.pointerId); } catch (_) {}
    ev.preventDefault();
  }

  function moveDrag(ev) {
    if (!drag || !els.pathBoardPopup) return;
    const maxLeft = Math.max(0, window.innerWidth - els.pathBoardPopup.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - els.pathBoardPopup.offsetHeight);
    const left = Math.max(0, Math.min(maxLeft, ev.clientX - drag.offsetX));
    const top = Math.max(0, Math.min(maxTop, ev.clientY - drag.offsetY));
    els.pathBoardPopup.style.left = `${left}px`;
    els.pathBoardPopup.style.top = `${top}px`;
  }

  function endDrag() {
    if (!drag || !els.pathBoardPopupHeader) return;
    try { els.pathBoardPopupHeader.releasePointerCapture(drag.pointerId); } catch (_) {}
    drag = null;
  }

  function bind() {
    if (els.pathBoardBtn && !triggerBound) {
      triggerBound = true;
      els.pathBoardBtn.addEventListener("click", () => {
        const panelManager = els.devPanelManager;
        if (panelManager && typeof panelManager.togglePanel === "function") {
          panelManager.togglePanel("path-board");
          return;
        }
        setOpen(!open);
      });
    }
    if (!els.pathBoardPopup || boundPathBoardRoot === els.pathBoardPopup) return;
    boundPathBoardRoot = els.pathBoardPopup;
    if (bound) return;
    bound = true;
    if (els.pathBoardPopupClose) {
      els.pathBoardPopupClose.addEventListener("click", () => {
        const panelManager = els.devPanelManager;
        if (panelManager && typeof panelManager.closePanel === "function") {
          panelManager.closePanel("path-board");
          return;
        }
        setOpen(false);
      });
    }
    if (els.pathBoardPopupHeader && !(els.devPanelManager && typeof els.devPanelManager.isOpen === "function")) {
      els.pathBoardPopupHeader.addEventListener("pointerdown", beginDrag);
      els.pathBoardPopupHeader.addEventListener("pointermove", moveDrag);
      els.pathBoardPopupHeader.addEventListener("pointerup", endDrag);
      els.pathBoardPopupHeader.addEventListener("pointercancel", endDrag);
    }
  }

  function registerManagedPanelHooks() {
    if (managedPanelHooksRegistered) return;
    const panelManager = els.devPanelManager;
    if (!panelManager || typeof panelManager.registerPanelHooks !== "function") return;
    managedPanelHooksRegistered = true;
    panelManager.registerPanelHooks("path-board", {
      onMount() {
        bound = false;
        bind();
        setOpen(true);
      },
      onBeforeClose() {
        setOpen(false);
        bound = false;
        boundPathBoardRoot = null;
      },
    });
  }

  registerManagedPanelHooks();

  return {
    bind,
    render,
    isOpen: () => open,
    close: () => setOpen(false),
    open: () => setOpen(true),
    toggle: () => setOpen(!open),
  };
}
