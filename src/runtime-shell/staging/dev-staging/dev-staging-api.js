import {
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-state.js?v=20260420g";
import { closeDevStagingTopmostPopup } from "./dev-staging-panel.js?v=20260421a";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260421a";

export function createDevStagingApi(root, refs, panels = {}) {
  return {
    root,
    refs,
    panels,
    setStatus(html, cls = "devStagingDim") {
      setDevStagingStatus(refs, html, cls);
    },
    setFatal(message = "") {
      setDevStagingFatal(refs, message);
    },
    setDebugNote(text = "") {
      setDevStagingDebugNote(refs, text);
    },
    closeTopmostPopup() {
      return closeDevStagingTopmostPopup(refs);
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
    resetMeters() {
      resetDevStagingHud(refs);
    },
    renderInputHud(vm) {
      renderDevStagingHud(refs, vm);
    },
  };
}
