import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LEVELS, getLevelById } from "../../src/content/levels/registry.js";
import { LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX } from "../../src/game-runtime/level/normalize-level-definition.js";
import { resolveLevelWorldSize } from "../../src/game-runtime/level/resolve-level-world-size.js";
import { buildSvgLevelSummaryOptions } from "../../src/game-runtime/level/svg-level-summary-options.js";
import {
  summarizeSvgLevelSource,
} from "../../src/game-runtime/level/svg-level-source.js";
import { DEFAULT_LEVEL_INSPECTION_ID } from "./level-contract-fixtures.mjs";
import { formatLevelInspectionSummary } from "./level-inspection-report.mjs";

const args = process.argv.slice(2);
const summaryOnly = args.includes("--summary");
const jsonOutput = args.includes("--json");
const positionalArgs = args.filter((arg) => arg !== "--summary" && arg !== "--json");

function pathFromAssetUrl(assetUrl = "") {
  try {
    return fileURLToPath(assetUrl);
  } catch (_) {
    return "";
  }
}

function findLevelForPath(targetPath = "") {
  const normalizedTarget = path.resolve(targetPath);
  return LEVELS.find((level) => {
    const assetPath = pathFromAssetUrl(level && level.mapSource && level.mapSource.assetUrl);
    return assetPath && path.resolve(assetPath) === normalizedTarget;
  }) || null;
}

function resolveInspectionTarget(input = "") {
  const requested = String(input || "").trim();
  const requestedLevel = requested ? getLevelById(requested) : null;
  const level = requestedLevel || getLevelById(DEFAULT_LEVEL_INSPECTION_ID);
  if (requestedLevel || !requested) {
    return {
      level,
      targetPath: pathFromAssetUrl(level && level.mapSource && level.mapSource.assetUrl),
    };
  }
  const targetPath = path.resolve(requested);
  return {
    level: findLevelForPath(targetPath) || level,
    targetPath,
  };
}

const target = resolveInspectionTarget(positionalArgs[0]);
const level = target.level;
const mapSource = level && level.mapSource ? level.mapSource : {};
const worldSize = resolveLevelWorldSize(level);
const targetPath = target.targetPath;
const worldWidthPx = Number(positionalArgs[1]) > 0 ? Number(positionalArgs[1]) : worldSize.widthPx;
const worldHeightPx = Number(positionalArgs[2]) > 0 ? Number(positionalArgs[2]) : worldSize.heightPx;
const tileSizePx = Number(positionalArgs[3]) > 0
  ? Number(positionalArgs[3])
  : (Number(mapSource.scale && mapSource.scale.boundaryTileSizePx) || LEVEL_BOUNDARY_TILE_SIZE_FALLBACK_PX);

const svgText = await fs.readFile(targetPath, "utf8");
const summary = summarizeSvgLevelSource(buildSvgLevelSummaryOptions({
  svgText,
  mapSource: {
    ...mapSource,
    scale: {
      ...(mapSource.scale || {}),
      boundaryTileSizePx: tileSizePx,
    },
  },
  worldWidthPx,
  worldHeightPx,
}));

const report = {
  levelId: level && level.id || null,
  file: targetPath,
  worldSize: {
    widthPx: worldWidthPx,
    heightPx: worldHeightPx,
  },
  viewBox: summary.viewBox,
  loopCount: summary.loopCount,
  loops: summary.loops.map((loop) => ({
    id: loop.id,
    authoredPointCount: Array.isArray(loop.authoredPoints) ? loop.authoredPoints.length : 0,
    worldPointCount: Array.isArray(loop.worldPoints) ? loop.worldPoints.length : 0,
    worldBounds: Array.isArray(loop.worldPoints) && loop.worldPoints.length
      ? {
          minX: Math.min(...loop.worldPoints.map((point) => Number(point.xW) || 0)),
          minY: Math.min(...loop.worldPoints.map((point) => Number(point.yW) || 0)),
          maxX: Math.max(...loop.worldPoints.map((point) => Number(point.xW) || 0)),
          maxY: Math.max(...loop.worldPoints.map((point) => Number(point.yW) || 0)),
        }
      : null,
  })),
  spawnPoints: summary.spawnPoints.map((spawn) => ({
    id: spawn.id,
    authoredCenter: spawn.authoredCenter,
    authoredRadius: spawn.authoredRadius,
    worldCenter: spawn.worldCenter,
  })),
  spawnCount: summary.spawnPoints.length,
  cameraAnchors: summary.cameraAnchors.map((anchor) => ({
    id: anchor.id,
    authoredCenter: anchor.authoredCenter,
    authoredRadius: anchor.authoredRadius,
    worldCenter: anchor.worldCenter,
  })),
  cameraBoundaryLoopCount: summary.cameraBoundaryLoops.length,
  worldItemSpawns: summary.worldItemSpawns.map((spawn) => ({
    id: spawn.id,
    kind: spawn.kind,
    authoredCenter: spawn.authoredCenter,
    authoredRadius: spawn.authoredRadius,
    worldCenter: spawn.worldCenter,
  })),
  propCount: summary.props.length,
  artShapeCount: summary.artShapes.length,
  starsFieldRegionCount: summary.starsFieldRegions.length,
  depthLayerCount: summary.depthLayers.length,
  boundaryTileMask: {
    tileSizePx: summary.boundaryTileMask.tileSizePx,
    cols: summary.boundaryTileMask.cols,
    rows: summary.boundaryTileMask.rows,
    occupiedTileCount: Array.isArray(summary.boundaryTileMask.occupiedKeys)
      ? summary.boundaryTileMask.occupiedKeys.length
      : 0,
    sampleOccupiedKeys: Array.isArray(summary.boundaryTileMask.occupiedKeys)
      ? summary.boundaryTileMask.occupiedKeys.slice(0, 24)
      : [],
  },
};

if (jsonOutput) {
  console.log(JSON.stringify(report));
} else if (summaryOnly) {
  console.log(formatLevelInspectionSummary(report));
} else {
  console.log(JSON.stringify(report, null, 2));
}
