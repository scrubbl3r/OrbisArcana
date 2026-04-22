import fs from "node:fs/promises";
import path from "node:path";
import {
  summarizeSvgLevelSource,
} from "../../src/game-runtime/level/svg-level-source.js";
import { LEVEL_MVP } from "../../src/content/levels/level-mvp/level-mvp.js";

const targetPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("src/content/levels/level-mvp/level-mvp.svg");
const worldWidthPx = Number(process.argv[3]) > 0 ? Number(process.argv[3]) : 8192;
const worldHeightPx = Number(process.argv[4]) > 0 ? Number(process.argv[4]) : 8192;
const tileSizePx = Number(process.argv[5]) > 0 ? Number(process.argv[5]) : 128;

const svgText = await fs.readFile(targetPath, "utf8");
const summary = summarizeSvgLevelSource({
  svgText,
  worldWidthPx,
  worldHeightPx,
  boundaryLayerLabels: LEVEL_MVP.mapSource.semanticLayers.boundary,
  spawnLayerLabels: LEVEL_MVP.mapSource.semanticLayers.spawn,
  spawnMarkerId: LEVEL_MVP.mapSource.spawnMarker.id,
  tileSizePx,
});

console.log(JSON.stringify({
  file: targetPath,
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
  spawnMarkers: summary.spawnMarkers.map((spawn) => ({
    id: spawn.id,
    authoredCenter: spawn.authoredCenter,
    authoredRadius: spawn.authoredRadius,
    worldCenter: spawn.worldCenter,
  })),
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
}, null, 2));
