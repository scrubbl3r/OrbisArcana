export function createUiOverlaysSystem({
  startScreenEl,
  calibOverlayEl,
  calibBtnEl,
  calibStatusEl,
  deathPanelEl,
  onCalibClosed,
}) {
  let deathOverlayTO = 0;

  function hideStartScreen() {
    if (!startScreenEl) return;
    startScreenEl.classList.add("off");
  }

  function openCalibOverlay(canCalibrate) {
    if (!calibOverlayEl) return;
    calibOverlayEl.classList.remove("off");
    calibOverlayEl.setAttribute("aria-hidden", "false");
    if (calibBtnEl) calibBtnEl.disabled = !canCalibrate;
  }

  function closeCalibOverlay() {
    if (!calibOverlayEl) return;
    calibOverlayEl.classList.add("off");
    calibOverlayEl.setAttribute("aria-hidden", "true");
    if (calibBtnEl) calibBtnEl.disabled = false;
    if (typeof onCalibClosed === "function") onCalibClosed();
  }

  function setCalibStatus(msg) {
    if (!calibStatusEl) return;
    calibStatusEl.textContent = msg;
  }

  function openDeathOverlay() {
    if (!deathPanelEl) return;
    deathPanelEl.classList.remove("off");
    deathPanelEl.setAttribute("aria-hidden", "false");
  }

  function closeDeathOverlay() {
    if (!deathPanelEl) return;
    deathPanelEl.classList.add("off");
    deathPanelEl.setAttribute("aria-hidden", "true");
  }

  function scheduleDeathOverlay(delayMs) {
    if (deathOverlayTO) {
      clearTimeout(deathOverlayTO);
      deathOverlayTO = 0;
    }
    closeDeathOverlay();
    deathOverlayTO = setTimeout(() => {
      deathOverlayTO = 0;
      openDeathOverlay();
    }, Math.max(0, Number(delayMs) || 0));
  }

  function clearDeathOverlaySchedule() {
    if (!deathOverlayTO) return;
    clearTimeout(deathOverlayTO);
    deathOverlayTO = 0;
  }

  return {
    hideStartScreen,
    openCalibOverlay,
    closeCalibOverlay,
    setCalibStatus,
    openDeathOverlay,
    closeDeathOverlay,
    scheduleDeathOverlay,
    clearDeathOverlaySchedule,
  };
}
