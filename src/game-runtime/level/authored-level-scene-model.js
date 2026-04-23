import { resolveLevelSpawnPoint, resolveLevelCameraAnchor } from "./resolve-level-spawn-point.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

export function buildAuthoredLevelSceneModel({
  level = null,
  summary = null,
  worldWidthPx = 0,
  worldHeightPx = 0,
  groundCenterWorld = () => Math.max(0, clampNumber(worldHeightPx, 0)) * 0.5,
} = {}) {
  const safeSummary = summary && typeof summary === "object" ? summary : null;
  const cameraAnchors = Array.isArray(safeSummary && safeSummary.cameraAnchors) ? safeSummary.cameraAnchors : [];
  const spawnMarkers = Array.isArray(safeSummary && safeSummary.spawnMarkers) ? safeSummary.spawnMarkers : [];
  const spawn = spawnMarkers.length
    ? spawnMarkers[0]
    : (() => {
        const resolvedSpawn = resolveLevelSpawnPoint(level, {
          worldWidthPx,
          groundCenterWorld,
        });
        return resolvedSpawn
          ? Object.freeze({
              id: "level_spawn",
              authoredCenter: Object.freeze({
                x: resolvedSpawn.xW,
                y: resolvedSpawn.yW,
              }),
              worldCenter: resolvedSpawn,
              authoredRadius: 0,
            })
          : null;
      })();

  return Object.freeze({
    summary: safeSummary,
    loops: Array.isArray(safeSummary && safeSummary.loops) ? safeSummary.loops : [],
    boundaryBox: safeSummary && safeSummary.boundaryBox ? safeSummary.boundaryBox : null,
    spawn,
    spawnMarkers: spawnMarkers,
    cameraAnchors,
    viewFloorGuides: Array.isArray(safeSummary && safeSummary.viewFloorGuides) ? safeSummary.viewFloorGuides : [],
    viewFloorGuide: Array.isArray(safeSummary && safeSummary.viewFloorGuides) && safeSummary.viewFloorGuides.length
      ? safeSummary.viewFloorGuides[0]
      : null,
    worldItemSpawns: Array.isArray(safeSummary && safeSummary.worldItemSpawns) ? safeSummary.worldItemSpawns : [],
    lineArtShapes: Array.isArray(safeSummary && safeSummary.lineArtShapes) ? safeSummary.lineArtShapes : [],
  });
}

export function resolveAuthoredLevelCameraTarget({
  level = null,
  sceneModel = null,
  initialTarget = "spawn",
  worldWidthPx = 0,
  worldHeightPx = 0,
} = {}) {
  const normalizedTarget = String(initialTarget || "spawn").trim().toLowerCase();
  const spawn = sceneModel && sceneModel.spawn && sceneModel.spawn.worldCenter ? sceneModel.spawn.worldCenter : null;
  const anchorTarget = normalizedTarget.startsWith("anchor:")
    ? resolveLevelCameraAnchor(level, normalizedTarget.slice("anchor:".length), {
        worldWidthPx,
        groundCenterWorld: () => Math.max(0, clampNumber(worldHeightPx, 0)) * 0.5,
        svgAnchors: sceneModel && Array.isArray(sceneModel.cameraAnchors) ? sceneModel.cameraAnchors : [],
      })
    : null;
  if (normalizedTarget === "spawn" && spawn) return spawn;
  if (anchorTarget && anchorTarget.point) return anchorTarget.point;
  if (spawn) return spawn;
  return Object.freeze({
    xW: Math.max(0, clampNumber(worldWidthPx, 0)) * 0.5,
    yW: Math.max(0, clampNumber(worldHeightPx, 0)) * 0.5,
  });
}

export function resolveViewFloorBootOffsetYW({
  targetYW = 0,
  boundaryBox = null,
  viewFloorGuide = null,
  viewportHeightPx = 0,
  zoom = 1,
} = {}) {
  if (!boundaryBox || !viewFloorGuide) return 0;
  const viewportWorldHeight = Math.max(1, clampNumber(viewportHeightPx, 0)) / Math.max(0.05, clampNumber(zoom, 1));
  const centeredCamTop = clampNumber(targetYW, 0) - (viewportWorldHeight * 0.5);
  const desiredFloorRatio = clamp01(viewFloorGuide.authoredScreenYRatio);
  const desiredCamTop = clampNumber(viewFloorGuide.worldY, 0) - (desiredFloorRatio * viewportWorldHeight);
  return desiredCamTop - centeredCamTop;
}
