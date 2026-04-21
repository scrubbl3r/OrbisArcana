import { setDevStagingFatal } from "./dev-staging-surface-state.js?v=20260421a";
import { closeDevStagingTopmostPanel } from "./dev-staging-panel.js?v=20260421j";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260421h";

export function createDevStagingApi(root, refs, panels = {}) {
  return {
    root,
    refs,
    panels,
    setFatal(message = "") {
      setDevStagingFatal(refs, message);
    },
    closeTopmostPanel() {
      return closeDevStagingTopmostPanel(refs);
    },
    openPanel(id) {
      return panels && panels.manager && typeof panels.manager.openPanel === "function"
        ? panels.manager.openPanel(id)
        : null;
    },
    closePanel(id) {
      return !!(panels && panels.manager && typeof panels.manager.closePanel === "function" && panels.manager.closePanel(id));
    },
    togglePanel(id) {
      return !!(panels && panels.manager && typeof panels.manager.togglePanel === "function" && panels.manager.togglePanel(id));
    },
    getPanelState() {
      return panels && panels.manager && typeof panels.manager.getState === "function"
        ? panels.manager.getState()
        : { openPanelIds: [], topmostPanelId: "", panels: [] };
    },
    subscribePanelState(listener) {
      return panels && panels.manager && typeof panels.manager.subscribe === "function"
        ? panels.manager.subscribe(listener)
        : (() => {});
    },
    resetMeters() {
      resetDevStagingHud(refs);
    },
    renderInputHud(vm) {
      renderDevStagingHud(refs, vm);
    },
  };
}
