import {
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-state.js";
import { closeDevStagingTopmostPopup } from "./dev-staging-panel.js";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js";

export function createDevStagingApi(root, refs) {
  return {
    root,
    refs,
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
    resetMeters() {
      resetDevStagingHud(refs);
    },
    renderInputHud(vm) {
      renderDevStagingHud(refs, vm);
    },
  };
}
