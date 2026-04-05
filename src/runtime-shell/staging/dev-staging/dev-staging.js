import {
  closeDevStagingTopmostPopup,
  projectDevStagingPanelRefs,
  renderDevStagingHud,
  resetDevStagingHud,
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-helpers.js";
import { createDevStagingApi } from "./dev-staging-api.js";
import { createDevStagingRefs } from "./dev-staging-refs.js";
import { DEV_STAGING_TEMPLATE } from "./dev-staging-template.js";

export {
  closeDevStagingTopmostPopup,
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
