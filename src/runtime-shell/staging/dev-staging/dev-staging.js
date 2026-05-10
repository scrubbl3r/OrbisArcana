import { setDevStagingFatal } from "./dev-staging-surface-state.js?v=20260421a";
import { createDevStagingApi } from "./dev-staging-api.js?v=20260509a";
import { renderDevStagingHud, resetDevStagingHud } from "./dev-staging-hud.js?v=20260509a";
import { createDevStagingPanelManager } from "./dev-staging-panel-manager.js?v=20260421h";
import {
  closeDevStagingTopmostPanel,
  createDevStagingPanelElementsFromView,
} from "./dev-staging-panel.js?v=20260421j";
import { createDevStagingRefs } from "./dev-staging-refs.js?v=20260421h";
import { mountCameraInputPanel } from "./camera-input-panel.js?v=20260421h";
import { mountInputHudPanel } from "./input-hud-panel.js?v=20260502a";
import { mountLogPanel } from "./log-panel.js?v=20260421h";
import { mountPathBoardPanel } from "./path-board-panel.js?v=20260421h";
import { DEV_STAGING_TEMPLATE } from "./dev-staging-template.js?v=20260421h";

export {
  closeDevStagingTopmostPanel,
  createDevStagingPanelElementsFromView,
  renderDevStagingHud,
  resetDevStagingHud,
  setDevStagingFatal,
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
  bindLauncher(refs.logBtn, "log");
  bindLauncher(refs.pathBoardBtn, "path-board");
  bindLauncher(refs.cameraInputBtn, "camera-input");

  manager.subscribe((state) => {
    const openIds = new Set(Array.isArray(state && state.openPanelIds) ? state.openPanelIds : []);
    const setActive = (button, active) => {
      if (!button) return;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.dataset.active = active ? "true" : "false";
      button.classList.toggle("on", active);
    };
    setActive(refs.dynamicsBtn, openIds.has("input-hud"));
    setActive(refs.logBtn, openIds.has("log"));
    setActive(refs.pathBoardBtn, openIds.has("path-board"));
    setActive(refs.cameraInputBtn, openIds.has("camera-input"));
  });

  manager.openPanel("input-hud");

  const api = createDevStagingApi(root, refs, { manager });
  return api;
}

export function renderDevStaging(root) {
  return mountDevStaging(root);
}
