import { createCameraInputPanelRefs } from "./camera-input-panel-refs.js";
import { CAMERA_INPUT_PANEL_TEMPLATE } from "./camera-input-panel-template.js";

export function mountCameraInputPanel(host) {
  if (!host) return null;
  host.innerHTML = CAMERA_INPUT_PANEL_TEMPLATE;
  const refs = createCameraInputPanelRefs(host);

  return {
    host,
    refs,
    unmount() {
      host.innerHTML = "";
    },
  };
}
