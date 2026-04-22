function cloneJsonLike(value, fallback = {}) {
  if (!value || typeof value !== "object") return { ...fallback };
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return { ...(value || fallback) };
  }
}

export function normalizeLevelDefinition(level = {}) {
  const source = level && typeof level === "object" ? level : {};
  const world = cloneJsonLike(source.world, {});
  const stage = cloneJsonLike(source.stage, {});
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
      heightPx: Number(world.heightPx) > 0 ? Number(world.heightPx) : 2000,
    }),
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
