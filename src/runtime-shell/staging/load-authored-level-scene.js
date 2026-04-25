import { summarizeSvgLevelSource } from "../../game-runtime/level/svg-level-source.js";
import { buildAuthoredLevelSceneModel } from "../../game-runtime/level/authored-level-scene-model.js";
import { buildLevelGraphicsModel } from "../../game-runtime/level-graphics/build-level-graphics-model.js?v=20260424b";

export async function loadAuthoredLevelScene({
  level = null,
  worldWidthPx = 0,
  worldHeightPx = 0,
  fetchImpl = globalThis.fetch,
} = {}) {
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : null;
  const assetUrl = String(mapSource && mapSource.assetUrl || "").trim();
  if (!mapSource || !assetUrl || typeof fetchImpl !== "function") return null;

  const response = await fetchImpl(assetUrl, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Level SVG fetch failed: ${response.status}`);
  }

  const svgText = await response.text();
  const summary = summarizeSvgLevelSource({
    svgText,
    worldWidthPx,
    worldHeightPx,
    boundaryLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.boundary,
    spawnLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.spawn,
    cameraLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.camera,
    cameraBoundaryLayerLabels:
      (mapSource.semanticLayers && mapSource.semanticLayers.cameraBounds) ||
      (mapSource.semanticLayers && mapSource.semanticLayers.boundsCam),
    worldItemLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.worldItems,
    lineArtLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.lineArt,
    starsFieldLayerLabels: mapSource.semanticLayers && mapSource.semanticLayers.starsField,
    spawnMarkerId: mapSource.spawnMarker && mapSource.spawnMarker.id,
    tileSizePx: mapSource.scale && mapSource.scale.boundaryTileSizePx,
  });

  const sceneModel = buildAuthoredLevelSceneModel({
    level,
    summary,
    worldWidthPx,
    worldHeightPx,
    groundCenterWorld: () => worldHeightPx * 0.5,
  });
  const levelGraphicsModel = buildLevelGraphicsModel({
    sceneModel,
  });

  return Object.freeze({
    assetUrl,
    svgText,
    summary,
    sceneModel,
    levelGraphicsModel,
  });
}
