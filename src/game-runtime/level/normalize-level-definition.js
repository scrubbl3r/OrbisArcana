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

function normalizeLevelMapSource(mapSource = {}, world = {}) {
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
        : (Number(world.widthPx) > 0 ? Number(world.widthPx) : 2000),
      worldHeightPx: Number(mapSource.scale && mapSource.scale.worldHeightPx) > 0
        ? Number(mapSource.scale.worldHeightPx)
        : (Number(world.heightPx) > 0 ? Number(world.heightPx) : 2000),
      boundaryTileSizePx: Number(mapSource.scale && mapSource.scale.boundaryTileSizePx) > 0
        ? Number(mapSource.scale.boundaryTileSizePx)
        : 128,
    }),
    semanticLayers: Object.freeze({
      boundary: Object.freeze(
        Array.isArray(mapSource.semanticLayers && mapSource.semanticLayers.boundary)
          ? mapSource.semanticLayers.boundary.slice()
          : []
      ),
      spawn: Object.freeze(
        Array.isArray(mapSource.semanticLayers && mapSource.semanticLayers.spawn)
          ? mapSource.semanticLayers.spawn.slice()
          : []
      ),
      camera: Object.freeze(
        Array.isArray(mapSource.semanticLayers && mapSource.semanticLayers.camera)
          ? mapSource.semanticLayers.camera.slice()
          : []
      ),
      viewFloor: Object.freeze(
        Array.isArray(mapSource.semanticLayers && mapSource.semanticLayers.viewFloor)
          ? mapSource.semanticLayers.viewFloor.slice()
          : []
      ),
    }),
    spawnMarker: Object.freeze({
      id: String(mapSource.spawnMarker && mapSource.spawnMarker.id || "").trim(),
    }),
  });
}

function normalizeLevelCamera(camera = {}, stage = {}) {
  return Object.freeze({
    previewZoom: Number(camera.previewZoom) > 0
      ? Number(camera.previewZoom)
      : (Number(stage.previewZoom) > 0 ? Number(stage.previewZoom) : 1),
    gameplayZoom: Number(camera.gameplayZoom) > 0 ? Number(camera.gameplayZoom) : 1,
    previewFollowMode: String(camera.previewFollowMode || camera.followMode || "follow_target_center").trim(),
    gameplayFollowMode: String(camera.gameplayFollowMode || camera.followMode || "follow_target_center").trim(),
    initialTarget: String(camera.initialTarget || "spawn").trim(),
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
  const sourceElements = cloneJsonLike(source.elements, {});
  const terrainProfile = Array.isArray(source.terrainProfile) ? source.terrainProfile.slice() : [];
  const worldItemSpawns = Array.isArray(sourceElements.worldItemSpawns)
    ? sourceElements.worldItemSpawns.slice()
    : (Array.isArray(source.worldItemSpawns) ? source.worldItemSpawns.slice() : []);
  const boundaries = Array.isArray(sourceElements.boundaries)
    ? sourceElements.boundaries.slice()
    : (Array.isArray(source.boundaries) ? source.boundaries.slice() : []);
  return Object.freeze({
    id: String(source.id || "").trim(),
    label: String(source.label || source.id || "Untitled Level").trim(),
    stage: Object.freeze({
      panelHeightPx: Number(stage.panelHeightPx) || 800,
      levelBoxHeightPx: Number(stage.levelBoxHeightPx) || 640,
      previewZoom: Number(stage.previewZoom) > 0 ? Number(stage.previewZoom) : 1,
    }),
    camera: normalizeLevelCamera(camera, stage),
    world: Object.freeze({
      widthPx: Number(world.widthPx) > 0 ? Number(world.widthPx) : 2000,
      heightPx: Number(world.heightPx) > 0 ? Number(world.heightPx) : 2000,
    }),
    spawn: Object.freeze({
      xW: normalizeOptionalNumber(spawn.xW),
      xNorm: normalizeOptionalNumber(spawn.xNorm),
      yW: normalizeOptionalNumber(spawn.yW),
      yMode: String(spawn.yMode || "absolute").trim(),
      yValue: normalizeOptionalNumber(spawn.yValue),
    }),
    cameraAnchors: Object.freeze(cameraAnchors.map((anchor = {}) => Object.freeze({
      id: String(anchor.id || "").trim(),
      xW: normalizeOptionalNumber(anchor.xW),
      xNorm: normalizeOptionalNumber(anchor.xNorm),
      yW: normalizeOptionalNumber(anchor.yW),
      yMode: String(anchor.yMode || "absolute").trim(),
      yValue: normalizeOptionalNumber(anchor.yValue),
    }))),
    mapSource: normalizeLevelMapSource(mapSource, world),
    terrain: Object.freeze({
      profile: Object.freeze(terrainProfile),
    }),
    elements: Object.freeze({
      boundaries: Object.freeze(boundaries),
      worldItemSpawns: Object.freeze(worldItemSpawns),
    }),
    // Compatibility aliases while downstream callers migrate to normalized buckets.
    terrainProfile: Object.freeze(terrainProfile),
    boundaries: Object.freeze(boundaries),
    worldItemSpawns: Object.freeze(worldItemSpawns),
  });
}
