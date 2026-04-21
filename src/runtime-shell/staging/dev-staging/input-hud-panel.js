import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js";
import { createInputHudPanelRefs } from "./input-hud-panel-refs.js";
import { INPUT_HUD_PANEL_TEMPLATE } from "./input-hud-panel-template.js";

export function mountInputHudPanel(host) {
  if (!host) return null;
  host.innerHTML = INPUT_HUD_PANEL_TEMPLATE;
  const refs = createInputHudPanelRefs(host);

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
