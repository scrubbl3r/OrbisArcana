export function createDevStagingRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    root,
    status: $("status"),
    fatal: $("fatal"),
    devStagingPanelStack: $("devStagingPanelStack"),
    dynamicsBtn: $("dynamicsBtn"),
    teleBtn: $("teleBtn"),
    cameraInputBtn: $("cameraInputBtn"),
    pathBoardBtn: $("pathBoardBtn"),
    kwsLog: $("kwsLog"),
    logTabGeneral: $("logTabGeneral"),
    logTabKws: $("logTabKws"),
    logTabPhone: $("logTabPhone"),
    pathBoardDebugPanel: $("pathBoardDebugPanel"),
    pathBoardDebugToggle: $("pathBoardDebugToggle"),
    pathBoardDebugBadge: $("pathBoardDebugBadge"),
    pathBoardDebugBody: $("pathBoardDebugBody"),
    devSpinAuditNote: $("devSpinAuditNote"),
  };
}
