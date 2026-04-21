import {
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-state.js";
import { createDevStagingApi } from "./dev-staging-api.js?v=20260421d";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260421b";
import { createDevStagingPanelManager } from "./dev-staging-panel-manager.js?v=20260421d";
import {
  closeDevStagingTopmostPopup,
  createDevStagingPanelElementsFromView,
  projectDevStagingPanelRefs,
} from "./dev-staging-panel.js?v=20260421d";
import { createDevStagingRefs } from "./dev-staging-refs.js?v=20260421d";
import { mountInputHudPanel } from "./input-hud-panel.js?v=20260421c";
import { mountLogPanel } from "./log-panel.js?v=20260421c";
import { mountPathBoardPanel } from "./path-board-panel.js?v=20260421d";
import { DEV_STAGING_TEMPLATE } from "./dev-staging-template.js?v=20260421d";

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
  const refs = baseRefs || {};
  const manager = createDevStagingPanelManager({
    stackHost: refs.devStagingPanelStack || null,
    sharedRefs: refs,
  });
  refs.devPanelManager = manager;
  manager.registerPanel("input-hud", {
    mount: (host) => mountInputHudPanel(host),
  });
  manager.registerPanel("log", {
    mount: (host) => mountLogPanel(host),
  });
  manager.registerPanel("path-board", {
    mount: (host) => mountPathBoardPanel(host),
  });
  manager.openPanel("input-hud");
  const api = createDevStagingApi(root, refs, { manager });

  api.resetMeters();
  return api;
}

export function renderDevStaging(root) {
  return mountDevStaging(root);
}
