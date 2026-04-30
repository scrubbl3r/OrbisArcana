function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

export function toDepthThreeX(worldX, worldWidthPx = 1) {
  return clampNumber(worldX, 0) - (Math.max(1, clampNumber(worldWidthPx, 1)) * 0.5);
}

export function toDepthThreeY(worldY, worldHeightPx = 1) {
  return (Math.max(1, clampNumber(worldHeightPx, 1)) * 0.5) - clampNumber(worldY, 0);
}

export function toDepthThreePoint({
  xW = 0,
  yW = 0,
  z = 0,
  worldWidthPx = 1,
  worldHeightPx = 1,
} = {}) {
  return Object.freeze({
    x: toDepthThreeX(xW, worldWidthPx),
    y: toDepthThreeY(yW, worldHeightPx),
    z: clampNumber(z, 0),
  });
}

export function resolveDepthSpawnAnchor(spawn = {}, {
  worldWidthPx = 1,
} = {}) {
  if (Number.isFinite(Number(spawn && spawn.xW)) || Number.isFinite(Number(spawn && spawn.yW))) {
    return Object.freeze({
      x: Number.isFinite(Number(spawn && spawn.xW)) ? Number(spawn.xW) : 0,
      y: Number.isFinite(Number(spawn && spawn.yW)) ? Number(spawn.yW) : 0,
    });
  }
  const worldCenter = spawn && spawn.worldCenter ? spawn.worldCenter : null;
  if (
    worldCenter
    && (Number.isFinite(Number(worldCenter.xW)) || Number.isFinite(Number(worldCenter.yW)))
  ) {
    return Object.freeze({
      x: Number.isFinite(Number(worldCenter.xW)) ? Number(worldCenter.xW) : 0,
      y: Number.isFinite(Number(worldCenter.yW)) ? Number(worldCenter.yW) : 0,
    });
  }
  return Object.freeze({
    x: Math.max(1, clampNumber(worldWidthPx, 1)) * clamp01(spawn && spawn.xNorm),
    y: 0,
  });
}
