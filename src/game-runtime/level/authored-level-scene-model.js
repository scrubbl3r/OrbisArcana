import { resolveLevelSpawnPoint, resolveLevelCameraAnchor } from "./resolve-level-spawn-point.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    cameraBoundaryLoops: Array.isArray(safeSummary && safeSummary.cameraBoundaryLoops) ? safeSummary.cameraBoundaryLoops : [],
    cameraBoundaryBox: safeSummary && safeSummary.cameraBoundaryBox ? safeSummary.cameraBoundaryBox : null,
    spawn,
    spawnMarkers: spawnMarkers,
    cameraAnchors,
    worldItemSpawns: Array.isArray(safeSummary && safeSummary.worldItemSpawns) ? safeSummary.worldItemSpawns : [],
    lineArtShapes: Array.isArray(safeSummary && safeSummary.lineArtShapes) ? safeSummary.lineArtShapes : [],
    starsFieldRegions: Array.isArray(safeSummary && safeSummary.starsFieldRegions) ? safeSummary.starsFieldRegions : [],
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
