export function createLogPanelRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    logPopup: $("logPopup"),
    logPopupTabs: $("logPopupTabs"),
    logPopupHeader: $("logPopupHeader"),
    logPopupClose: $("logPopupClose"),
    logTabGeneral: $("logTabGeneral"),
    logTabKws: $("logTabKws"),
    logTabPhone: $("logTabPhone"),
    kwsLog: $("kwsLog"),
  };
}
