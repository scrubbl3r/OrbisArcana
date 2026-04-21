import {
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-state.js";
import { createDevStagingApi } from "./dev-staging-api.js?v=20260420g";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260420g";
import {
  closeDevStagingTopmostPopup,
  createDevStagingPanelElementsFromView,
  projectDevStagingPanelRefs,
} from "./dev-staging-panel.js?v=20260420g";
import { createDevStagingRefs } from "./dev-staging-refs.js?v=20260420g";
import { DEV_STAGING_TEMPLATE } from "./dev-staging-template.js?v=20260420g";

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
  const refs = createDevStagingRefs(root);
  const api = createDevStagingApi(root, refs);

  api.resetMeters();
  return api;
}

export function renderDevStaging(root) {
  return mountDevStaging(root);
}
