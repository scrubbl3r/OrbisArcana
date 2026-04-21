export function createPathBoardPanelRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    pathBoardPanel: $("pathBoardPanel"),
    pathBoardPanelHeader: $("pathBoardPanelHeader"),
    pathBoardPanelClose: $("pathBoardPanelClose"),
    pathBoardBody: $("pathBoardBody"),
    kwsReadout: $("kwsReadout"),
    rulesReadout: $("rulesReadout"),
    kwsTokenThrInput: $("kwsTokenThrInput"),
    kwsCooldownMsInput: $("kwsCooldownMsInput"),
    kwsApplyTuneBtn: $("kwsApplyTuneBtn"),
  };
}
