import { summarizeSvgLevelSource } from "../../game-runtime/level/svg-level-source.js";
import { buildAuthoredLevelSceneModel } from "../../game-runtime/level/authored-level-scene-model.js";
import { buildLevelGraphicsModel } from "../../game-runtime/level-graphics/build-level-graphics-model.js?v=20260425l";

export async function loadAuthoredLevelScene({
  level = null,
  worldWidthPx = 0,
  worldHeightPx = 0,
  fetchImpl = globalThis.fetch,
} = {}) {
  const mapSource = level && typeof level.mapSource === "object" ? level.mapSource : null;
  const assetUrl = String(mapSource && mapSource.assetUrl || "").trim();
  if (!mapSource || !assetUrl || typeof fetchImpl !== "function") return null;

  let fetchUrl = assetUrl;
  try {
    const url = new URL(assetUrl, globalThis.location && globalThis.location.href || undefined);
    url.searchParams.set("_oa_svg_v", String(Date.now()));
    fetchUrl = url.toString();
  } catch (_) {
    fetchUrl = assetUrl;
  }
  const response = await fetchImpl(fetchUrl, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Level SVG fetch failed: ${response.status}`);
  }

  const svgText = await response.text();
  const semanticLayers = mapSource.semanticLayers && typeof mapSource.semanticLayers === "object"
    ? mapSource.semanticLayers
    : {};
  const summary = summarizeSvgLevelSource({
    svgText,
    worldWidthPx,
    worldHeightPx,
    boundaryLayerLabels: semanticLayers.boundary || semanticLayers.bounds,
    spawnLayerLabels: semanticLayers.spawn || semanticLayers.spawns,
    cameraLayerLabels: semanticLayers.camera || semanticLayers.cameras,
    cameraBoundaryLayerLabels:
      semanticLayers.cameraBounds ||
      semanticLayers.boundsCam,
    worldItemLayerLabels: semanticLayers.worldItems || semanticLayers.actorItems || semanticLayers.globes,
    propLayerLabels: semanticLayers.props,
    lineArtLayerLabels: semanticLayers.lineArt || semanticLayers.art,
    starsFieldLayerLabels: semanticLayers.starsField || semanticLayers.fields,
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
