export const LEVEL_WORLD_SIZE_FALLBACK_PX = 2048;

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveLevelWorldSize(level = null, mapSourceOverride = null) {
  const mapSource = mapSourceOverride && typeof mapSourceOverride === "object"
    ? mapSourceOverride
    : (level && typeof level.mapSource === "object" ? level.mapSource : {});
  const sourceScale = mapSource && typeof mapSource.scale === "object" ? mapSource.scale : {};
  const world = level && typeof level.world === "object" ? level.world : {};
  return Object.freeze({
    widthPx: Math.max(
      1,
      clampNumber(sourceScale.worldWidthPx, 0) ||
      clampNumber(world.widthPx, 0) ||
      clampNumber(mapSource.authoringViewBox && mapSource.authoringViewBox.width, 0) ||
      LEVEL_WORLD_SIZE_FALLBACK_PX
    ),
    heightPx: Math.max(
      1,
      clampNumber(sourceScale.worldHeightPx, 0) ||
      clampNumber(world.heightPx, 0) ||
      clampNumber(mapSource.authoringViewBox && mapSource.authoringViewBox.height, 0) ||
      LEVEL_WORLD_SIZE_FALLBACK_PX
    ),
  });
}
