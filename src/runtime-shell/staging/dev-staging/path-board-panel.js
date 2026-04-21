import { createPathBoardPanelRefs } from "./path-board-panel-refs.js";
import { PATH_BOARD_PANEL_TEMPLATE } from "./path-board-panel-template.js";

export function mountPathBoardPanel(host) {
  if (!host) return null;
  host.innerHTML = PATH_BOARD_PANEL_TEMPLATE;
  const refs = createPathBoardPanelRefs(host);

  return {
    host,
    refs,
    unmount() {
      host.innerHTML = "";
    },
  };
}
