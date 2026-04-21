import {
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-state.js";
import { createDevStagingApi } from "./dev-staging-api.js?v=20260421b";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260421b";
import {
  closeDevStagingTopmostPopup,
  createDevStagingPanelElementsFromView,
  projectDevStagingPanelRefs,
} from "./dev-staging-panel.js?v=20260421b";
import { createDevStagingRefs } from "./dev-staging-refs.js?v=20260421b";
import { mountInputHudPanel } from "./input-hud-panel.js?v=20260421b";
import { DEV_STAGING_TEMPLATE } from "./dev-staging-template.js?v=20260421b";

export {
  closeDevStagingTopmostPopup,
  createDevStagingPanelElementsFromView,
  projectDevStagingPanelRefs,
  renderDevStagingHud,
  resetDevStagingHud,
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
};

export function mountDevStaging(root) {
  if (!root) return null;
  root.innerHTML = DEV_STAGING_TEMPLATE;
  const baseRefs = createDevStagingRefs(root);
  const inputHudPanel = baseRefs && baseRefs.inputHudPanelHost
    ? mountInputHudPanel(baseRefs.inputHudPanelHost)
    : null;
  const refs = inputHudPanel
    ? { ...baseRefs, ...inputHudPanel.refs }
    : baseRefs;
  const api = createDevStagingApi(root, refs, { inputHudPanel });

  api.resetMeters();
  return api;
}

export function renderDevStaging(root) {
  return mountDevStaging(root);
}
