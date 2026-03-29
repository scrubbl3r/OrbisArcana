export function createWordFlashboardPopup({
  els = {},
  words = [],
  canonicalToken = (token) => String(token || "").trim().toLowerCase(),
  getListenableTokens = () => new Set(),
  getFlashUntilMs = () => 0,
} = {}) {
  const flashboardWords = Array.isArray(words)
    ? words.map((entry) => Object.freeze({ ...entry }))
    : [];
  let bound = false;
  let open = false;
  let drag = null;

  function wordBoardChipHtml(displayText, lit, flash) {
    const cls = `wordBoardChip${lit ? " on" : ""}${flash ? " flash" : ""}`;
    return `<div class="${cls}">${String(displayText || "")}</div>`;
  }

  function render() {
    if (!open || !els.wordBoardBody) return;
    const now = Date.now();
    const listenableTokens = getListenableTokens() instanceof Set
      ? getListenableTokens()
      : new Set();
    const html = flashboardWords
      .map((entry) => {
        const phrase = canonicalToken(entry && entry.phrase);
        const lit = listenableTokens.has(phrase);
        const flash = Number(getFlashUntilMs(phrase) || 0) > now;
        const displayText = String(entry && entry.displayText || entry && entry.label || entry && entry.phrase || entry && entry.id || "");
        return wordBoardChipHtml(displayText, lit, flash);
      })
      .join("");
    els.wordBoardBody.innerHTML = html;
  }

  function setOpen(nextOpen) {
    open = !!nextOpen;
    if (els.wordBoardPopup) {
      els.wordBoardPopup.classList.toggle("on", open);
      els.wordBoardPopup.setAttribute("aria-hidden", open ? "false" : "true");
    }
    if (!open) {
      if (els.wordBoardBody) els.wordBoardBody.textContent = "";
      return;
    }
    render();
  }

  function beginDrag(ev) {
    if (!els.wordBoardPopup || !els.wordBoardPopupHeader) return;
    if (ev.target && typeof ev.target.closest === "function" && ev.target.closest("button")) return;
    const rect = els.wordBoardPopup.getBoundingClientRect();
    drag = {
      pointerId: ev.pointerId,
      offsetX: ev.clientX - rect.left,
      offsetY: ev.clientY - rect.top,
    };
    try { els.wordBoardPopupHeader.setPointerCapture(ev.pointerId); } catch (_) {}
    ev.preventDefault();
  }

  function moveDrag(ev) {
    if (!drag || !els.wordBoardPopup) return;
    const maxLeft = Math.max(0, window.innerWidth - els.wordBoardPopup.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - els.wordBoardPopup.offsetHeight);
    const left = Math.max(0, Math.min(maxLeft, ev.clientX - drag.offsetX));
    const top = Math.max(0, Math.min(maxTop, ev.clientY - drag.offsetY));
    els.wordBoardPopup.style.left = `${left}px`;
    els.wordBoardPopup.style.top = `${top}px`;
  }

  function endDrag() {
    if (!drag || !els.wordBoardPopupHeader) return;
    try { els.wordBoardPopupHeader.releasePointerCapture(drag.pointerId); } catch (_) {}
    drag = null;
  }

  function bind() {
    if (bound) return;
    bound = true;
    if (els.wordBoardBtn) {
      els.wordBoardBtn.addEventListener("click", () => {
        setOpen(!open);
      });
    }
    if (els.wordBoardPopupClose) {
      els.wordBoardPopupClose.addEventListener("click", () => setOpen(false));
    }
    if (els.wordBoardPopupHeader) {
      els.wordBoardPopupHeader.addEventListener("pointerdown", beginDrag);
      els.wordBoardPopupHeader.addEventListener("pointermove", moveDrag);
      els.wordBoardPopupHeader.addEventListener("pointerup", endDrag);
      els.wordBoardPopupHeader.addEventListener("pointercancel", endDrag);
    }
  }

  return {
    bind,
    render,
    isOpen: () => open,
    close: () => setOpen(false),
    open: () => setOpen(true),
    toggle: () => setOpen(!open),
  };
}
