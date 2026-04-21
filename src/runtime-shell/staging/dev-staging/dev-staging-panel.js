export function closeDevStagingTopmostPopup(refs) {
  if (!refs) return false;
  if (refs.devPanelManager && typeof refs.devPanelManager.isOpen === "function" && refs.devPanelManager.isOpen("camera-input")) {
    refs.devPanelManager.closePanel("camera-input");
    return true;
  }
  if (refs.devPanelManager && typeof refs.devPanelManager.isOpen === "function" && refs.devPanelManager.isOpen("path-board")) {
    refs.devPanelManager.closePanel("path-board");
    return true;
  }
  if (refs.devPanelManager && typeof refs.devPanelManager.isOpen === "function" && refs.devPanelManager.isOpen("log")) {
    refs.devPanelManager.closePanel("log");
    return true;
  }
  if (refs.devPanelManager && typeof refs.devPanelManager.isOpen === "function" && refs.devPanelManager.isOpen("input-hud")) {
    refs.devPanelManager.closePanel("input-hud");
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
    dynamicsBtn: refs.dynamicsBtn || null,
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
    pathBoardDebugPanel: refs.pathBoardDebugPanel || null,
    pathBoardDebugToggle: refs.pathBoardDebugToggle || null,
    pathBoardDebugBadge: refs.pathBoardDebugBadge || null,
    pathBoardDebugBody: refs.pathBoardDebugBody || null,
  };
}

export function createDevStagingPanelElementsFromView(view = null) {
  if (view && view.refs) return view.refs;
  return (view && typeof view === "object") ? view : {};
}
