export function createLogPanelRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    logPanel: $("logPanel"),
    logPanelTabs: $("logPanelTabs"),
    logPanelHeader: $("logPanelHeader"),
    logPanelClose: $("logPanelClose"),
    logTabGeneral: $("logTabGeneral"),
    logTabKws: $("logTabKws"),
    logTabPhone: $("logTabPhone"),
    kwsLog: $("kwsLog"),
  };
}
