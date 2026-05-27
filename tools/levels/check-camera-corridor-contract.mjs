import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getLevelById } from "../../src/content/levels/registry.js";
import { resolveCameraFrame } from "../../src/game-runtime/camera/camera-runtime.js";
import { resolveLevelWorldSize } from "../../src/game-runtime/level/resolve-level-world-size.js";
import { buildSvgLevelSummaryOptions } from "../../src/game-runtime/level/svg-level-summary-options.js";
import { summarizeSvgLevelSource } from "../../src/game-runtime/level/svg-level-source.js";

function assertNear(actual, expected, label) {
  assert.equal(Math.abs(Number(actual) - Number(expected)) < 0.0001, true, `${label}: expected ${expected}, got ${actual}`);
}

const corridorLoop = Object.freeze({
  worldPoints: Object.freeze([
    Object.freeze({ xW: 0, yW: 0 }),
    Object.freeze({ xW: 100, yW: 0 }),
    Object.freeze({ xW: 100, yW: 100 }),
    Object.freeze({ xW: 0, yW: 100 }),
    Object.freeze({ xW: 0, yW: 0 }),
  ]),
});

const outsideFrame = resolveCameraFrame({
  targetXW: 160,
  targetYW: 50,
  viewportWidthPx: 20,
  viewportHeightPx: 20,
  worldWidthPx: 200,
  worldHeightPx: 200,
  zoom: 1,
  screenAnchorX: 0.5,
  screenAnchorY: 0.5,
  clampLeftXW: 0,
  clampRightXW: 200,
  clampTopYW: 0,
  clampBottomYW: 200,
  cameraBoundaryLoops: [corridorLoop],
});

assertNear(outsideFrame.centerXW, 100, "outside target should project to corridor edge x");
assertNear(outsideFrame.centerYW, 50, "outside target should preserve nearest corridor y");
assert.equal(outsideFrame.cameraCorridorConstrained, true, "outside target should report corridor constraint");

const insideFrame = resolveCameraFrame({
  targetXW: 80,
  targetYW: 50,
  viewportWidthPx: 20,
  viewportHeightPx: 20,
  worldWidthPx: 200,
  worldHeightPx: 200,
  zoom: 1,
  screenAnchorX: 0.5,
  screenAnchorY: 0.5,
  clampLeftXW: 0,
  clampRightXW: 200,
  clampTopYW: 0,
  clampBottomYW: 200,
  cameraBoundaryLoops: [corridorLoop],
});

assertNear(insideFrame.centerXW, 80, "inside target should keep target center x");
assertNear(insideFrame.centerYW, 50, "inside target should keep target center y");
assert.equal(insideFrame.cameraCorridorConstrained, false, "inside target should not report corridor constraint");

const centeredCorridorLoop = Object.freeze({
  worldPoints: Object.freeze([
    Object.freeze({ xW: 100, yW: 100 }),
    Object.freeze({ xW: 200, yW: 100 }),
    Object.freeze({ xW: 200, yW: 200 }),
    Object.freeze({ xW: 100, yW: 200 }),
    Object.freeze({ xW: 100, yW: 100 }),
  ]),
});

const narrowCorridorFrame = resolveCameraFrame({
  targetXW: 150,
  targetYW: 150,
  viewportWidthPx: 140,
  viewportHeightPx: 20,
  worldWidthPx: 300,
  worldHeightPx: 300,
  zoom: 1,
  screenAnchorX: 0.5,
  screenAnchorY: 0.5,
  clampLeftXW: 100,
  clampRightXW: 200,
  clampTopYW: 100,
  clampBottomYW: 200,
  cameraBoundaryLoops: [centeredCorridorLoop],
});

assertNear(narrowCorridorFrame.centerXW, 150, "wide viewport should not bias an inside corridor center");
assertNear(narrowCorridorFrame.centerYW, 150, "wide viewport should preserve inside corridor y");

const level = getLevelById("reactor-shaft");
const mapSource = level && level.mapSource ? level.mapSource : {};
const worldSize = resolveLevelWorldSize(level);
const svgText = await fs.readFile(fileURLToPath(mapSource.assetUrl), "utf8");
const summary = summarizeSvgLevelSource(buildSvgLevelSummaryOptions({
  svgText,
  mapSource,
  worldWidthPx: worldSize.widthPx,
  worldHeightPx: worldSize.heightPx,
}));

assert.equal(summary.cameraBoundaryLoops.length > 0, true, "reactor-shaft should expose authored bounds_cam loops");
console.log("camera corridor contract ok");
