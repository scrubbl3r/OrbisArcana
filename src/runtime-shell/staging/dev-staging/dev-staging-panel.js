export function closeDevStagingTopmostPopup(refs) {
  if (!refs) return false;
  if (refs.wordBoardPopup && refs.wordBoardPopup.classList.contains("on") && refs.wordBoardPopupClose) {
    refs.wordBoardPopupClose.click();
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
    wordBoardBtn: refs.wordBoardBtn || null,
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
    wordBoardPopup: refs.wordBoardPopup || null,
    wordBoardPopupHeader: refs.wordBoardPopupHeader || null,
    wordBoardPopupClose: refs.wordBoardPopupClose || null,
    wordBoardBody: refs.wordBoardBody || null,
    wordBoardDebugPanel: refs.wordBoardDebugPanel || null,
    wordBoardDebugToggle: refs.wordBoardDebugToggle || null,
    wordBoardDebugBadge: refs.wordBoardDebugBadge || null,
    wordBoardDebugBody: refs.wordBoardDebugBody || null,
  };
}

export function createDevStagingPanelElementsFromView(view = null) {
  const refs = (view && view.refs)
    ? view.refs
    : (view && typeof view === "object" ? view : {});
  return projectDevStagingPanelRefs(refs);
}
