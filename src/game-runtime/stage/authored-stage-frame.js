import { applyAuthoredStarsFieldParallax } from "./authored-level-overlay.js";

function applyAuthoredCameraVarsToWorld(worldEl, {
  worldWidthPx = 0,
  worldHeightPx = 0,
  zoom = 1,
  camLeft = 0,
  camTop = 0,
} = {}) {
  if (!worldEl) return;
  const frameZoom = Number(zoom || 1);
  worldEl.style.setProperty("--level-world-width", `${Number(worldWidthPx) || 0}px`);
  worldEl.style.setProperty("--level-world-height", `${Number(worldHeightPx) || 0}px`);
  worldEl.style.setProperty("--level-world-zoom", `${frameZoom}`);
  worldEl.style.setProperty("--level-world-x", `${(-Number(camLeft || 0) * frameZoom).toFixed(2)}px`);
  worldEl.style.setProperty("--level-world-y", `${(-Number(camTop || 0) * frameZoom).toFixed(2)}px`);
}

export function applyAuthoredStageCameraVars({
  refs = {},
  starsParallaxRefs = [],
  worldWidthPx = 0,
  worldHeightPx = 0,
  camLeft = 0,
  camTop = 0,
  zoom = 1,
  viewportWidthPx = 0,
  viewportHeightPx = 0,
} = {}) {
  const cameraVars = {
    worldWidthPx,
    worldHeightPx,
    zoom,
    camLeft,
    camTop,
  };
  applyAuthoredCameraVarsToWorld(refs.world, cameraVars);
  applyAuthoredCameraVarsToWorld(refs.actorWorld, cameraVars);
  applyAuthoredCameraVarsToWorld(refs.topArtWorld, cameraVars);
  applyAuthoredStarsFieldParallax(starsParallaxRefs, {
    camLeft: Number(camLeft || 0),
    camTop: Number(camTop || 0),
    zoom: Number(zoom || 1),
    viewportWidthPx: Number(viewportWidthPx) || 0,
    viewportHeightPx: Number(viewportHeightPx) || 0,
  });
}
