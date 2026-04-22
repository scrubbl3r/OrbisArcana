function cloneJsonLike(value, fallback = {}) {
  if (!value || typeof value !== "object") return { ...fallback };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return { ...(value || fallback) };
  }
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
    boundaryPathIds: Object.freeze(Array.isArray(mapSource.boundaryPathIds) ? mapSource.boundaryPathIds.slice() : []),
  });
}

export function normalizeLevelDefinition(level = {}) {
  const source = level && typeof level === "object" ? level : {};
  const world = cloneJsonLike(source.world, {});
  const stage = cloneJsonLike(source.stage, {});
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
    }),
    world: Object.freeze({
      widthPx: Number(world.widthPx) > 0 ? Number(world.widthPx) : 2000,
      heightPx: Number(world.heightPx) > 0 ? Number(world.heightPx) : 2000,
    }),
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
