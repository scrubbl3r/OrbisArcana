export function createDevStagingRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    root,
    fatal: $("fatal"),
    devStagingPanelStack: $("devStagingPanelStack"),
    dynamicsBtn: $("dynamicsBtn"),
    teleBtn: $("teleBtn"),
    cameraInputBtn: $("cameraInputBtn"),
    pathBoardBtn: $("pathBoardBtn"),
  };
}
