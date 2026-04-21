export function createPathBoardPanelRefs(root) {
  if (!root) return null;
  const $ = (id) => root.querySelector(`#${id}`);
  return {
    pathBoardPopup: $("pathBoardPopup"),
    pathBoardPopupHeader: $("pathBoardPopupHeader"),
    pathBoardPopupClose: $("pathBoardPopupClose"),
    pathBoardBody: $("pathBoardBody"),
    kwsReadout: $("kwsReadout"),
    rulesReadout: $("rulesReadout"),
    kwsTokenThrInput: $("kwsTokenThrInput"),
    kwsCooldownMsInput: $("kwsCooldownMsInput"),
    kwsApplyTuneBtn: $("kwsApplyTuneBtn"),
  };
}
