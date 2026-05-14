import { LEVEL_WORLD_SIZE_FALLBACK_PX } from "./resolve-level-world-size.js";

export const LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX = 128;
export const LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX = 800;
export const LEVEL_STAGE_BOX_HEIGHT_FALLBACK_PX = 640;
export const LEVEL_STAGE_PREVIEW_ZOOM_FALLBACK = 1;
export const LEVEL_CAMERA_MODE_GAMEPLAY = "gameplay";
export const LEVEL_CAMERA_MODE_PREVIEW = "preview";
export const LEVEL_CAMERA_FOLLOW_MODE_FALLBACK = "follow_target_center";
export const LEVEL_CAMERA_INITIAL_TARGET_FALLBACK = "spawn";
export const LEVEL_POINT_Y_MODE_FALLBACK = "absolute";
export const LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET = "ground_center_offset";
export const LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE = "energy_globe";
export const LEVEL_WORLD_ITEM_KIND_ENERGY_GLOBE_EMITTER = "energy_globe_emitter";
export const LEVEL_WORLD_ITEM_Z_MODE_FALLBACK = "fixed";
export const LEVEL_WORLD_ITEM_REGEN_TRIGGER_MANUAL = "manual";
export const LEVEL_WORLD_ITEM_REGEN_TRIGGER_GLOBE_SPENT = "globe_spent";
export const LEVEL_SVG_METADATA_Z_MODE_ORB = "orb";
export const LEVEL_SVG_METADATA_Z_MODE_WORLD = "world";
export const LEVEL_SVG_METADATA_SCALE_MODE_FIXED = "fixed";
export const LEVEL_SVG_METADATA_SCALE_MODE_ORB = "orb";
export const LEVEL_SVG_PROP_ANCHOR_CENTER = "center";
export const LEVEL_SVG_PROP_ANCHOR_TOP = "top";
export const LEVEL_SVG_PROP_ANCHOR_BOTTOM = "bottom";
export const LEVEL_SVG_PROP_ANCHOR_BASE = "base";
export const LEVEL_SVG_DEPTH_MATERIAL_FALLBACK = "graphite";
export const LEVEL_SVG_DEPTH_TESSELLATION_FALLBACK = 24;
export const LEVEL_SVG_LAYER_BOUNDS = "bounds";
export const LEVEL_SVG_LAYER_CAMERA_BOUNDS = "bounds_cam";
export const LEVEL_SVG_LAYER_SPAWNS = "spawns";
export const LEVEL_SVG_LAYER_CAMERAS = "cameras";
export const LEVEL_SVG_LAYER_DEPTHS = "depths";
export const LEVEL_SVG_LAYER_GLOBES = "globes";
export const LEVEL_SVG_LAYER_ENEMIES = "enemies";
export const LEVEL_SVG_LAYER_PROPS = "props";
export const LEVEL_SVG_LAYER_ART = "art";
export const LEVEL_SVG_LAYER_FIELDS = "fields";
export const LEVEL_SVG_LAYER_STAR_FIELD = "star_field";
export const LEVEL_SVG_LAYER_ORB = "orb";

function cloneJsonLike(value, fallback = {}) {
  if (!value || typeof value !== "object") return { ...fallback };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return { ...(value || fallback) };
  }
}

function normalizeOptionalNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeLayerLabels(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return Object.freeze(value.slice());
  }
  return Object.freeze([]);
}

function normalizeLevelMapSource(mapSource = {}, world = {}) {
  const semanticLayers = mapSource.semanticLayers && typeof mapSource.semanticLayers === "object"
    ? mapSource.semanticLayers
    : {};
  return Object.freeze({
    kind: String(mapSource.kind || "").trim(),
    assetUrl: String(mapSource.assetUrl || "").trim(),
    authoringViewBox: Object.freeze({
      x: Number(mapSource.authoringViewBox && mapSource.authoringViewBox.x) || 0,
      y: Number(mapSource.authoringViewBox && mapSource.authoringViewBox.y) || 0,
      width: Number(mapSource.authoringViewBox && mapSource.authoringViewBox.width) || 0,
      height: Number(mapSource.authoringViewBox && mapSource.authoringViewBox.height) || 0,
    }),
    scale: Object.freeze({
      worldWidthPx: Number(mapSource.scale && mapSource.scale.worldWidthPx) > 0
        ? Number(mapSource.scale.worldWidthPx)
        : (Number(world.widthPx) > 0 ? Number(world.widthPx) : LEVEL_WORLD_SIZE_FALLBACK_PX),
      worldHeightPx: Number(mapSource.scale && mapSource.scale.worldHeightPx) > 0
        ? Number(mapSource.scale.worldHeightPx)
        : (Number(world.heightPx) > 0 ? Number(world.heightPx) : LEVEL_WORLD_SIZE_FALLBACK_PX),
      boundaryTileSizePx: Number(mapSource.scale && mapSource.scale.boundaryTileSizePx) > 0
        ? Number(mapSource.scale.boundaryTileSizePx)
        : LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX,
    }),
    semanticLayers: Object.freeze({
      boundary: normalizeLayerLabels(semanticLayers.boundary),
      spawns: normalizeLayerLabels(semanticLayers.spawns),
      cameras: normalizeLayerLabels(semanticLayers.cameras),
      cameraBounds: normalizeLayerLabels(semanticLayers.cameraBounds),
      depths: normalizeLayerLabels(semanticLayers.depths),
      worldItems: normalizeLayerLabels(semanticLayers.worldItems),
      enemies: normalizeLayerLabels(semanticLayers.enemies),
      props: normalizeLayerLabels(semanticLayers.props),
      art: normalizeLayerLabels(semanticLayers.art),
      fields: normalizeLayerLabels(semanticLayers.fields),
      orb: normalizeLayerLabels(semanticLayers.orb),
    }),
    primarySpawn: Object.freeze({
      id: String(mapSource.primarySpawn && mapSource.primarySpawn.id || "").trim(),
    }),
  });
}

function normalizeLevelCamera(camera = {}, stage = {}) {
  return Object.freeze({
    previewZoom: Number(camera.previewZoom) > 0
      ? Number(camera.previewZoom)
      : (Number(stage.previewZoom) > 0 ? Number(stage.previewZoom) : LEVEL_STAGE_PREVIEW_ZOOM_FALLBACK),
    gameplayZoom: Number(camera.gameplayZoom) > 0 ? Number(camera.gameplayZoom) : 1,
    previewFollowMode: String(camera.previewFollowMode || camera.followMode || LEVEL_CAMERA_FOLLOW_MODE_FALLBACK).trim(),
    gameplayFollowMode: String(camera.gameplayFollowMode || camera.followMode || LEVEL_CAMERA_FOLLOW_MODE_FALLBACK).trim(),
    initialTarget: String(camera.initialTarget || LEVEL_CAMERA_INITIAL_TARGET_FALLBACK).trim(),
    screenAnchorX: Number(camera.screenAnchorX) >= 0 ? Number(camera.screenAnchorX) : 0.5,
    screenAnchorY: Number(camera.screenAnchorY) >= 0 ? Number(camera.screenAnchorY) : 0.5,
    deadzoneWidthPx: Number(camera.deadzoneWidthPx) >= 0 ? Number(camera.deadzoneWidthPx) : -1,
    deadzoneHeightPx: Number(camera.deadzoneHeightPx) >= 0 ? Number(camera.deadzoneHeightPx) : -1,
    deadzoneWidthRatio: Number(camera.deadzoneWidthRatio) >= 0 ? Number(camera.deadzoneWidthRatio) : 0,
    deadzoneHeightRatio: Number(camera.deadzoneHeightRatio) >= 0 ? Number(camera.deadzoneHeightRatio) : 0,
    followLerpX: Number(camera.followLerpX) >= 0 ? Number(camera.followLerpX) : 1,
    followLerpY: Number(camera.followLerpY) >= 0 ? Number(camera.followLerpY) : 1,
    clampInsetLeftPx: Number(camera.clampInsetLeftPx) >= 0 ? Number(camera.clampInsetLeftPx) : 0,
    clampInsetRightPx: Number(camera.clampInsetRightPx) >= 0 ? Number(camera.clampInsetRightPx) : 0,
    clampInsetTopPx: Number(camera.clampInsetTopPx) >= 0 ? Number(camera.clampInsetTopPx) : 0,
    clampInsetBottomPx: Number(camera.clampInsetBottomPx) >= 0 ? Number(camera.clampInsetBottomPx) : 0,
    fixedFrameAnchorId: String(camera.fixedFrameAnchorId || "").trim(),
    fixedFrameCenterXW: normalizeOptionalNumber(camera.fixedFrameCenterXW),
    fixedFrameCenterYW: normalizeOptionalNumber(camera.fixedFrameCenterYW),
  });
}

export function normalizeLevelDefinition(level = {}) {
  const source = level && typeof level === "object" ? level : {};
  const world = cloneJsonLike(source.world, {});
  const stage = cloneJsonLike(source.stage, {});
  const camera = cloneJsonLike(source.camera, {});
  const spawn = cloneJsonLike(source.spawn, {});
  const cameraAnchors = Array.isArray(source.cameraAnchors) ? source.cameraAnchors.slice() : [];
  const mapSource = cloneJsonLike(source.mapSource, {});
  const sourceTerrain = cloneJsonLike(source.terrain, {});
  const sourceElements = cloneJsonLike(source.elements, {});
  const terrainEntries = Array.isArray(sourceTerrain.profile) ? sourceTerrain.profile.slice() : [];
  const worldItemSpawns = Array.isArray(sourceElements.worldItemSpawns)
    ? sourceElements.worldItemSpawns.slice()
    : [];
  const boundaries = Array.isArray(sourceElements.boundaries)
    ? sourceElements.boundaries.slice()
    : [];
  return Object.freeze({
    id: String(source.id || "").trim(),
    label: String(source.label || source.id || "Untitled Level").trim(),
    stage: Object.freeze({
      panelHeightPx: Number(stage.panelHeightPx) || LEVEL_STAGE_PANEL_HEIGHT_FALLBACK_PX,
      levelBoxHeightPx: Number(stage.levelBoxHeightPx) || LEVEL_STAGE_BOX_HEIGHT_FALLBACK_PX,
      previewZoom: Number(stage.previewZoom) > 0 ? Number(stage.previewZoom) : LEVEL_STAGE_PREVIEW_ZOOM_FALLBACK,
    }),
    camera: normalizeLevelCamera(camera, stage),
    world: Object.freeze({
      widthPx: Number(world.widthPx) > 0 ? Number(world.widthPx) : LEVEL_WORLD_SIZE_FALLBACK_PX,
      heightPx: Number(world.heightPx) > 0 ? Number(world.heightPx) : LEVEL_WORLD_SIZE_FALLBACK_PX,
    }),
    spawn: Object.freeze({
      xW: normalizeOptionalNumber(spawn.xW),
      xNorm: normalizeOptionalNumber(spawn.xNorm),
      yW: normalizeOptionalNumber(spawn.yW),
      yMode: String(spawn.yMode || LEVEL_POINT_Y_MODE_FALLBACK).trim(),
      yValue: normalizeOptionalNumber(spawn.yValue),
    }),
    cameraAnchors: Object.freeze(cameraAnchors.map((anchor = {}) => Object.freeze({
      id: String(anchor.id || "").trim(),
      xW: normalizeOptionalNumber(anchor.xW),
      xNorm: normalizeOptionalNumber(anchor.xNorm),
      yW: normalizeOptionalNumber(anchor.yW),
      yMode: String(anchor.yMode || LEVEL_POINT_Y_MODE_FALLBACK).trim(),
      yValue: normalizeOptionalNumber(anchor.yValue),
    }))),
    mapSource: normalizeLevelMapSource(mapSource, world),
    terrain: Object.freeze({
      profile: Object.freeze(terrainEntries),
    }),
    elements: Object.freeze({
      boundaries: Object.freeze(boundaries),
      worldItemSpawns: Object.freeze(worldItemSpawns),
    }),
  });
}
