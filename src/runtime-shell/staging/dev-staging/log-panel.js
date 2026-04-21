import { createLogPanelRefs } from "./log-panel-refs.js";
import { LOG_PANEL_TEMPLATE } from "./log-panel-template.js";

export function mountLogPanel(host) {
  if (!host) return null;
  host.innerHTML = LOG_PANEL_TEMPLATE;
  const refs = createLogPanelRefs(host);

  return {
    host,
    refs,
    unmount() {
      host.innerHTML = "";
    },
  };
}
