export function createKwsReceiverBridge({
  getPanelController,
  getRuntimeController,
  defaultGateTimeoutMs = 1500,
} = {}) {
  const getPanel = (typeof getPanelController === "function")
    ? getPanelController
    : () => null;
  const getRuntime = (typeof getRuntimeController === "function")
    ? getRuntimeController
    : () => null;

  function startReadoutTick() {
    const panel = getPanel();
    if (!panel || typeof panel.startKwsReadoutTick !== "function") return;
    panel.startKwsReadoutTick();
  }

  function stopReadoutTick() {
    const panel = getPanel();
    if (!panel || typeof panel.stopKwsReadoutTick !== "function") return;
    panel.stopKwsReadoutTick();
  }

  function clearWakeHudGateTimer() {
    const panel = getPanel();
    if (!panel || typeof panel.clearKwsWakeHudGateTimer !== "function") return;
    panel.clearKwsWakeHudGateTimer();
  }

  function clearAutostartWatchdog() {
    const runtime = getRuntime();
    if (!runtime || typeof runtime.clearAutostartWatchdog !== "function") return;
    runtime.clearAutostartWatchdog();
  }

  function startAutostartWatchdog() {
    const runtime = getRuntime();
    if (!runtime || typeof runtime.startAutostartWatchdog !== "function") return;
    runtime.startAutostartWatchdog();
  }

  function canonicalToken(rawToken) {
    const panel = getPanel();
    if (!panel || typeof panel.canonicalKwsToken !== "function") return "";
    return panel.canonicalKwsToken(rawToken);
  }

  function isWakeWindowActive() {
    const panel = getPanel();
    if (!panel || typeof panel.isWakeWindowActive !== "function") return false;
    return panel.isWakeWindowActive();
  }

  function shouldLogHeardWakeword(rawToken) {
    const panel = getPanel();
    if (!panel || typeof panel.shouldLogHeardWakeword !== "function") return false;
    return panel.shouldLogHeardWakeword(rawToken);
  }

  function resetHeardWakeWindowTokensForAxis(axis) {
    const panel = getPanel();
    if (!panel || typeof panel.resetHeardWakeWindowTokensForAxis !== "function") return;
    panel.resetHeardWakeWindowTokensForAxis(axis);
  }

  function resetHeardWakeWindowTokensAllAxes() {
    const panel = getPanel();
    if (!panel || typeof panel.resetHeardWakeWindowTokensAllAxes !== "function") return;
    panel.resetHeardWakeWindowTokensAllAxes();
  }

  function markHeardWakeWindowToken(axis, token) {
    const panel = getPanel();
    if (!panel || typeof panel.markHeardWakeWindowToken !== "function") return;
    panel.markHeardWakeWindowToken(axis, token);
  }

  function setSelectedSpinWord(axis, spinWord) {
    const panel = getPanel();
    if (!panel) return;
    if (typeof panel.setSelectedSpinWord === "function") {
      panel.setSelectedSpinWord(axis, spinWord);
    }
  }

  function flashToken(token, ms = 360) {
    const panel = getPanel();
    if (!panel || typeof panel.flashKwsToken !== "function") return;
    panel.flashKwsToken(token, ms);
  }

  function openWakeHudGate(timeoutMs = defaultGateTimeoutMs) {
    const panel = getPanel();
    if (!panel || typeof panel.openKwsWakeHudGate !== "function") return;
    panel.openKwsWakeHudGate(timeoutMs);
  }

  function updateReadout() {
    const panel = getPanel();
    if (!panel || typeof panel.updateKwsReadout !== "function") return;
    panel.updateKwsReadout();
  }

  function pushLogLine(text, kind = "") {
    const panel = getPanel();
    if (!panel || typeof panel.pushKwsLogLine !== "function") return;
    panel.pushKwsLogLine(text, kind);
  }

  function syncTuneUiFromStatus(status) {
    const panel = getPanel();
    if (!panel || typeof panel.syncKwsTuneUiFromStatus !== "function") return;
    panel.syncKwsTuneUiFromStatus(status);
  }

  return {
    startReadoutTick,
    stopReadoutTick,
    clearWakeHudGateTimer,
    clearAutostartWatchdog,
    startAutostartWatchdog,
    canonicalToken,
    isWakeWindowActive,
    shouldLogHeardWakeword,
    resetHeardWakeWindowTokensForAxis,
    resetHeardWakeWindowTokensAllAxes,
    markHeardWakeWindowToken,
    setSelectedSpinWord,
    flashToken,
    openWakeHudGate,
    updateReadout,
    pushLogLine,
    syncTuneUiFromStatus,
  };
}
