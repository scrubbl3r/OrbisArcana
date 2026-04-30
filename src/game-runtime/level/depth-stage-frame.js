import {
  LEVEL_DEPTH_CAMERA_FOV_DEG,
  LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS,
  resolveDepthCameraZ,
} from "./depth-projection.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeDepthRenderFrame(frame = {}) {
  return Object.freeze({
    camLeft: clampNumber(frame.camLeft, 0),
    camTop: clampNumber(frame.camTop, 0),
    zoom: clampNumber(frame.zoom, 1),
    viewportWidthPx: clampNumber(frame.viewportWidthPx, 0),
    viewportHeightPx: clampNumber(frame.viewportHeightPx, 0),
    isBootFrame: !!frame.isBootFrame,
  });
}

export function resolveDepthBootFrame({
  depthLayers = [],
  root = null,
} = {}) {
  const width = Math.max(1, Math.round(root && root.clientWidth || (globalThis.innerWidth || 1)));
  const height = Math.max(1, Math.round(root && root.clientHeight || (globalThis.innerHeight || 1)));
  const boxes = (Array.isArray(depthLayers) ? depthLayers : [])
    .map((layer) => layer && layer.boundaryBox ? layer.boundaryBox : null)
    .filter(Boolean);
  if (!boxes.length) {
    return Object.freeze({
      camLeft: 0,
      camTop: 0,
      zoom: 1,
      viewportWidthPx: width,
      viewportHeightPx: height,
    });
  }
  const left = Math.min(...boxes.map((box) => clampNumber(box.leftXW, 0)));
  const top = Math.min(...boxes.map((box) => clampNumber(box.topYW, 0)));
  const right = Math.max(...boxes.map((box) => clampNumber(box.rightXW, 0)));
  const bottom = Math.max(...boxes.map((box) => clampNumber(box.bottomYW, 0)));
  const centerX = (left + right) * 0.5;
  const centerY = (top + bottom) * 0.5;
  return Object.freeze({
    camLeft: Math.max(0, centerX - (width * 0.5)),
    camTop: Math.max(0, centerY - (height * 0.5)),
    zoom: 1,
    viewportWidthPx: width,
    viewportHeightPx: height,
  });
}

export function resolveDepthCameraFrame({
  frame = {},
  root = null,
  worldWidthPx = 1,
  worldHeightPx = 1,
  fovDeg = LEVEL_DEPTH_CAMERA_FOV_DEG,
  farPaddingWorldUnits = LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS * 32,
} = {}) {
  const width = Math.max(1, Math.round(clampNumber(frame.viewportWidthPx, root && root.clientWidth || 1)));
  const height = Math.max(1, Math.round(clampNumber(frame.viewportHeightPx, root && root.clientHeight || 1)));
  const safeZoom = Math.max(0.05, clampNumber(frame.zoom, 1));
  const viewW = width / safeZoom;
  const viewH = height / safeZoom;
  const centerXW = clampNumber(frame.camLeft, 0) + (viewW * 0.5);
  const centerYW = clampNumber(frame.camTop, 0) + (viewH * 0.5);
  const safeWorldWidth = Math.max(1, clampNumber(worldWidthPx, 1));
  const safeWorldHeight = Math.max(1, clampNumber(worldHeightPx, 1));
  const x = centerXW - (safeWorldWidth * 0.5);
  const y = (safeWorldHeight * 0.5) - centerYW;
  const z = resolveDepthCameraZ({
    viewportHeightPx: height,
    zoom: safeZoom,
    fovDeg,
  });
  return Object.freeze({
    width,
    height,
    x,
    y,
    z,
    aspect: width / height,
    near: Math.max(1, z * 0.02),
    far: Math.max(24000, z + Math.max(0, clampNumber(farPaddingWorldUnits, 0))),
  });
}
