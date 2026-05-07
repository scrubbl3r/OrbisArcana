export function bindShellKwsEventRuntime({
  bindKwsEventHandlers = null,
  eventBus = null,
  receiverEvents = {},
  kwsDebugState = {},
  kwsBridge = null,
  kwsPanelController = null,
  kwsTokenUiState = null,
  kwsListenPolicyController = null,
  runtimeConfig = {},
} = {}) {
  if (typeof bindKwsEventHandlers !== "function") return null;
  return bindKwsEventHandlers({
    eventBus,
    events: receiverEvents,
    state: kwsDebugState,
    deps: {
      canonicalKwsToken: (token) => kwsBridge.canonicalToken(token),
      flashKwsToken: (token, ms) => kwsBridge.flashToken(token, ms),
      isWakeWindowActive: () => kwsBridge.isWakeWindowActive(),
      markHeardWakeWindowToken: (axis, token) => {
        if (kwsPanelController && typeof kwsPanelController.markHeardWakeWindowToken === "function") {
          kwsPanelController.markHeardWakeWindowToken(axis, token);
        }
      },
      getActiveSpinAxis: () => (kwsTokenUiState ? String(kwsTokenUiState.activeSpinAxis || "") : ""),
      openKwsWakeHudGate: (timeoutMs) => kwsBridge.openWakeHudGate(timeoutMs),
      shouldLogHeardWakeword: (rawToken) => kwsBridge.shouldLogHeardWakeword(rawToken),
      pushKwsLogLine: (text, kind) => kwsBridge.pushLogLine(text, kind),
      updateKwsReadout: () => kwsBridge.updateReadout(),
      isUngatedToken: () => false,
      setActiveSpinAxis: (axis) => {
        if (kwsPanelController && typeof kwsPanelController.setActiveSpinAxis === "function") {
          kwsPanelController.setActiveSpinAxis(axis);
        }
      },
      clearActiveSpinState: () => {
        if (kwsPanelController && typeof kwsPanelController.clearActiveSpinState === "function") {
          kwsPanelController.clearActiveSpinState();
        } else {
          kwsBridge.resetHeardWakeWindowTokensAllAxes();
        }
      },
      resetHeardWakeWindowTokensForAxis: (axis) => kwsBridge.resetHeardWakeWindowTokensForAxis(axis),
      resetHeardWakeWindowTokensAllAxes: () => kwsBridge.resetHeardWakeWindowTokensAllAxes(),
      setSelectedSpinWord: (axis, spinWord) => {
        if (kwsPanelController && typeof kwsPanelController.setSelectedSpinWord === "function") {
          kwsPanelController.setSelectedSpinWord(axis, spinWord);
        }
      },
      getKwsMode: () => String(kwsDebugState.mode || ""),
      getListenPolicyStatus: () => (
        kwsListenPolicyController && typeof kwsListenPolicyController.getStatus === "function"
          ? kwsListenPolicyController.getStatus()
          : null
      ),
      gateTimeoutMs: Math.max(0, Number(runtimeConfig.gateTimeoutMs) || 1500),
    },
  });
}
