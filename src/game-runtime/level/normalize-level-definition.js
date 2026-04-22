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
    terrainProfile: Object.freeze(Array.isArray(source.terrainProfile) ? source.terrainProfile.slice() : []),
    worldItemSpawns: Object.freeze(Array.isArray(source.worldItemSpawns) ? source.worldItemSpawns.slice() : []),
  });
}
