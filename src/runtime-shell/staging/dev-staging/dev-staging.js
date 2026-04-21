import {
  setDevStagingDebugNote,
  setDevStagingFatal,
  setDevStagingStatus,
} from "./dev-staging-surface-state.js";
import { createDevStagingApi } from "./dev-staging-api.js?v=20260421g";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260421b";
import { createDevStagingPanelManager } from "./dev-staging-panel-manager.js?v=20260421g";
import {
  closeDevStagingTopmostPopup,
  createDevStagingPanelElementsFromView,
  projectDevStagingPanelRefs,
} from "./dev-staging-panel.js?v=20260421g";
import { createDevStagingRefs } from "./dev-staging-refs.js?v=20260421f";
import { mountCameraInputPanel } from "./camera-input-panel.js?v=20260421e";
import { mountInputHudPanel } from "./input-hud-panel.js?v=20260421f";
import { mountLogPanel } from "./log-panel.js?v=20260421c";
import { mountPathBoardPanel } from "./path-board-panel.js?v=20260421d";
import { DEV_STAGING_TEMPLATE } from "./dev-staging-template.js?v=20260421f";

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
    title: "Dynamics",
    mount: (host) => mountInputHudPanel(host, {
      onRequestClose: () => manager.closePanel("input-hud"),
    }),
  });
  manager.registerPanel("log", {
    title: "Log",
    mount: (host) => mountLogPanel(host),
  });
  manager.registerPanel("path-board", {
    title: "Path Board",
    mount: (host) => mountPathBoardPanel(host),
  });
  manager.registerPanel("camera-input", {
    title: "Camera Input",
    mount: (host) => mountCameraInputPanel(host),
  });
  function bindLauncher(button, panelId) {
    if (!button) return;
    button.addEventListener("click", () => {
      manager.togglePanel(panelId);
    });
  }
  bindLauncher(refs.dynamicsBtn, "input-hud");

  manager.subscribe((state) => {
    const openIds = new Set(Array.isArray(state && state.openPanelIds) ? state.openPanelIds : []);
    const setActive = (button, active) => {
      if (!button) return;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.dataset.active = active ? "true" : "false";
      button.classList.toggle("on", active);
    };
    setActive(refs.dynamicsBtn, openIds.has("input-hud"));
    setActive(refs.teleBtn, openIds.has("log"));
    setActive(refs.pathBoardBtn, openIds.has("path-board"));
    setActive(refs.cameraInputBtn, openIds.has("camera-input"));
  });

  const api = createDevStagingApi(root, refs, { manager });
  return api;
}

export function renderDevStaging(root) {
  return mountDevStaging(root);
}
