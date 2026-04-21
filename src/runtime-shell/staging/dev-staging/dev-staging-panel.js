export function closeDevStagingTopmostPopup(refs) {
  if (!refs) return false;
  if (refs.cameraInputPopup && refs.cameraInputPopup.classList.contains("on") && refs.cameraInputPopupClose) {
    refs.cameraInputPopupClose.click();
    return true;
  }
  if (refs.pathBoardPopup && refs.pathBoardPopup.classList.contains("on") && refs.pathBoardPopupClose) {
    refs.pathBoardPopupClose.click();
    return true;
  }
  if (refs.logPopup && refs.logPopup.classList.contains("on") && refs.logPopupClose) {
    refs.logPopupClose.click();
    return true;
  }
  return false;
}

export function projectDevStagingPanelRefs(refs = {}) {
  return {
    teleBtn: refs.teleBtn || null,
    cameraInputBtn: refs.cameraInputBtn || null,
    pathBoardBtn: refs.pathBoardBtn || null,
    kwsReadout: refs.kwsReadout || null,
    kwsLog: refs.kwsLog || null,
    logTabGeneral: refs.logTabGeneral || null,
    logTabKws: refs.logTabKws || null,
    logTabPhone: refs.logTabPhone || null,
    kwsTokenThrInput: refs.kwsTokenThrInput || null,
    kwsCooldownMsInput: refs.kwsCooldownMsInput || null,
    kwsApplyTuneBtn: refs.kwsApplyTuneBtn || null,
    logPopup: refs.logPopup || null,
    logPopupTabs: refs.logPopupTabs || null,
    logPopupHeader: refs.logPopupHeader || null,
    logPopupClose: refs.logPopupClose || null,
    pathBoardPopup: refs.pathBoardPopup || null,
    pathBoardPopupHeader: refs.pathBoardPopupHeader || null,
    pathBoardPopupClose: refs.pathBoardPopupClose || null,
    pathBoardBody: refs.pathBoardBody || null,
    cameraInputPopup: refs.cameraInputPopup || null,
    cameraInputPopupHeader: refs.cameraInputPopupHeader || null,
    cameraInputPopupClose: refs.cameraInputPopupClose || null,
    cameraInputStatusReadout: refs.cameraInputStatusReadout || null,
    cameraInputLifecycleReadout: refs.cameraInputLifecycleReadout || null,
    cameraInputPermissionReadout: refs.cameraInputPermissionReadout || null,
    cameraInputTrackingReadout: refs.cameraInputTrackingReadout || null,
    cameraInputHandReadout: refs.cameraInputHandReadout || null,
    cameraInputFailureReadout: refs.cameraInputFailureReadout || null,
    cameraInputSignalTrack: refs.cameraInputSignalTrack || null,
    cameraInputSignalFill: refs.cameraInputSignalFill || null,
    cameraInputSignalDot: refs.cameraInputSignalDot || null,
    cameraInputSignalConfidence: refs.cameraInputSignalConfidence || null,
    cameraInputRawXReadout: refs.cameraInputRawXReadout || null,
    cameraInputFilteredXReadout: refs.cameraInputFilteredXReadout || null,
    cameraInputCenteredXReadout: refs.cameraInputCenteredXReadout || null,
    cameraInputConfidenceReadout: refs.cameraInputConfidenceReadout || null,
    cameraInputFpsReadout: refs.cameraInputFpsReadout || null,
    pathBoardDebugPanel: refs.pathBoardDebugPanel || null,
    pathBoardDebugToggle: refs.pathBoardDebugToggle || null,
    pathBoardDebugBadge: refs.pathBoardDebugBadge || null,
    pathBoardDebugBody: refs.pathBoardDebugBody || null,
  };
}

export function createDevStagingPanelElementsFromView(view = null) {
  const refs = (view && view.refs)
    ? view.refs
    : (view && typeof view === "object" ? view : {});
  return projectDevStagingPanelRefs(refs);
}
