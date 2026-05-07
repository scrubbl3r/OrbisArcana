import { LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX } from "./normalize-level-definition.js";

export function buildSvgLevelSummaryOptions({
  svgText = "",
  mapSource = null,
  worldWidthPx = 0,
  worldHeightPx = 0,
} = {}) {
  const safeMapSource = mapSource && typeof mapSource === "object" ? mapSource : {};
  const semanticLayers = safeMapSource.semanticLayers && typeof safeMapSource.semanticLayers === "object"
    ? safeMapSource.semanticLayers
    : {};
  return Object.freeze({
    svgText,
    worldWidthPx,
    worldHeightPx,
    boundaryLayerLabels: semanticLayers.boundary || [],
    spawnLayerLabels: semanticLayers.spawns || [],
    cameraLayerLabels: semanticLayers.cameras || [],
    cameraBoundaryLayerLabels: semanticLayers.cameraBounds || [],
    worldItemLayerLabels: semanticLayers.worldItems || [],
    propLayerLabels: semanticLayers.props || [],
    artLayerLabels: semanticLayers.art || [],
    starsFieldLayerLabels: semanticLayers.fields || [],
    spawnMarkerId:
      safeMapSource.primarySpawn && safeMapSource.primarySpawn.id ||
      safeMapSource.spawnMarker && safeMapSource.spawnMarker.id,
    tileSizePx: Number(safeMapSource.scale && safeMapSource.scale.boundaryTileSizePx) || LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
  });
}
