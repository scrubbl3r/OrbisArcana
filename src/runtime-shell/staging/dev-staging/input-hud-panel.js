import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260510c";
import { createInputHudPanelRefs } from "./input-hud-panel-refs.js?v=20260510c";
import { INPUT_HUD_PANEL_TEMPLATE } from "./input-hud-panel-template.js?v=20260511a";

export function mountInputHudPanel(host, { onRequestClose = null } = {}) {
  if (!host) return null;
  host.innerHTML = INPUT_HUD_PANEL_TEMPLATE;
  const refs = createInputHudPanelRefs(host);
  if (refs.dynamicsPanelClose) {
    refs.dynamicsPanelClose.addEventListener("click", () => {
      if (typeof onRequestClose === "function") onRequestClose();
    });
  }

  return {
    host,
    refs,
    render(vm) {
      renderDevStagingHud(refs, vm);
    },
    reset() {
      resetDevStagingHud(refs);
    },
    unmount() {
      host.innerHTML = "";
    },
  };
}
