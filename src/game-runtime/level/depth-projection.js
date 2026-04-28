export const LEVEL_DEPTH_CAMERA_FOV_DEG = 42;
export const LEVEL_DEPTH_DEFAULT_ORB_Z_BO = 4;
export const LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS = 72;

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveDepthCameraZ({
  viewportHeightPx = 0,
  zoom = 1,
  fovDeg = LEVEL_DEPTH_CAMERA_FOV_DEG,
} = {}) {
  const height = Math.max(1, clampNumber(viewportHeightPx, 1));
  const safeZoom = Math.max(0.05, clampNumber(zoom, 1));
  const viewH = height / safeZoom;
  const fovRad = (Math.max(1, clampNumber(fovDeg, LEVEL_DEPTH_CAMERA_FOV_DEG)) * Math.PI) / 180;
  return Math.max(64, viewH / (2 * Math.tan(fovRad * 0.5)));
}

export function resolveDepthProjectionScale({
  cameraZ = 0,
  depthPx = 0,
} = {}) {
  const camera = Math.max(1, clampNumber(cameraZ, 1));
  const depth = Math.max(0, clampNumber(depthPx, 0));
  return camera / (camera + depth);
}

export function resolveApparentDepthScale({
  cameraZ = 0,
  depthPx = 0,
} = {}) {
  const projectedScale = resolveDepthProjectionScale({ cameraZ, depthPx });
  return projectedScale > 0 ? (1 / projectedScale) : 1;
}

export function resolveOrbTravelZBO(summary = null, fallback = LEVEL_DEPTH_DEFAULT_ORB_Z_BO) {
  const layers = Array.isArray(summary && summary.depthLayers) ? summary.depthLayers : [];
  for (const layer of layers) {
    const zBO = Number(layer && layer.orbZBO);
    if (Number.isFinite(zBO) && zBO >= 0) return zBO;
  }
  return Math.max(0, clampNumber(fallback, LEVEL_DEPTH_DEFAULT_ORB_Z_BO));
}
