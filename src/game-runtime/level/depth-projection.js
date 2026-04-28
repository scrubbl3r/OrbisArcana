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

export function projectBoundsToDepthPlane({
  boundaryBox = null,
  depthPx = 0,
  cameraZ = 0,
  originXW = null,
  originYW = null,
} = {}) {
  if (!boundaryBox || typeof boundaryBox !== "object") return null;
  const left = clampNumber(boundaryBox.leftXW, 0);
  const right = clampNumber(boundaryBox.rightXW, left);
  const top = clampNumber(boundaryBox.topYW, 0);
  const bottom = clampNumber(boundaryBox.bottomYW, top);
  if (right <= left || bottom <= top) return null;

  const scale = resolveDepthProjectionScale({ cameraZ, depthPx });
  const originX = originXW != null && Number.isFinite(Number(originXW))
    ? Number(originXW)
    : ((left + right) * 0.5);
  const originY = originYW != null && Number.isFinite(Number(originYW))
    ? Number(originYW)
    : ((top + bottom) * 0.5);
  const projectX = (x) => originX + ((x - originX) * scale);
  const projectY = (y) => originY + ((y - originY) * scale);
  const projectedLeft = projectX(left);
  const projectedRight = projectX(right);
  const projectedTop = projectY(top);
  const projectedBottom = projectY(bottom);

  return Object.freeze({
    ...boundaryBox,
    authoredBoundaryBox: boundaryBox,
    projectionDepthPx: Math.max(0, clampNumber(depthPx, 0)),
    projectionScale: scale,
    projectionOriginXW: originX,
    projectionOriginYW: originY,
    leftXW: Math.min(projectedLeft, projectedRight),
    rightXW: Math.max(projectedLeft, projectedRight),
    topYW: Math.min(projectedTop, projectedBottom),
    bottomYW: Math.max(projectedTop, projectedBottom),
    widthW: Math.abs(projectedRight - projectedLeft),
    heightW: Math.abs(projectedBottom - projectedTop),
  });
}

export function projectWorldPointToDepthPlane({
  point = null,
  depthPx = 0,
  cameraZ = 0,
  originXW = 0,
  originYW = 0,
} = {}) {
  if (!point || typeof point !== "object") return null;
  const x = clampNumber(point.xW, 0);
  const y = clampNumber(point.yW, 0);
  const scale = resolveDepthProjectionScale({ cameraZ, depthPx });
  return Object.freeze({
    ...point,
    xW: originXW + ((x - originXW) * scale),
    yW: originYW + ((y - originYW) * scale),
  });
}

export function projectLoopsToDepthPlane({
  loops = [],
  depthPx = 0,
  cameraZ = 0,
  originXW = 0,
  originYW = 0,
} = {}) {
  if (!Array.isArray(loops)) return Object.freeze([]);
  return Object.freeze(loops.map((loop) => {
    const worldPoints = Array.isArray(loop && loop.worldPoints)
      ? loop.worldPoints
          .map((point) => projectWorldPointToDepthPlane({
            point,
            depthPx,
            cameraZ,
            originXW,
            originYW,
          }))
          .filter(Boolean)
      : [];
    return Object.freeze({
      ...loop,
      authoredLoop: loop,
      projectionDepthPx: Math.max(0, clampNumber(depthPx, 0)),
      projectionScale: resolveDepthProjectionScale({ cameraZ, depthPx }),
      projectionOriginXW: originXW,
      projectionOriginYW: originYW,
      worldPoints: Object.freeze(worldPoints),
    });
  }));
}
