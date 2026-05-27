import assert from "node:assert/strict";
import { createCameraRuntime } from "../../src/game-runtime/camera/camera-runtime.js";

function assertNear(actual, expected, label) {
  assert.equal(Math.abs(Number(actual) - Number(expected)) < 0.0001, true, `${label}: expected ${expected}, got ${actual}`);
}

let nowMs = 0;
const camera = createCameraRuntime({ now: () => nowMs });

camera.requestTravel({
  fromXW: 20,
  toXW: 120,
  fromYW: 40,
  toYW: 240,
  durationMs: 1000,
  easing: "linear",
});

nowMs = 500;
const midFrame = camera.resolveFrame({
  targetXW: 120,
  targetYW: 240,
  viewportWidthPx: 20,
  viewportHeightPx: 20,
  worldWidthPx: 400,
  worldHeightPx: 400,
  zoom: 1,
  followMode: "follow_target_center",
  screenAnchorX: 0.5,
  screenAnchorY: 0.5,
  clampLeftXW: 0,
  clampRightXW: 400,
  clampTopYW: 0,
  clampBottomYW: 400,
});

assertNear(midFrame.targetXW, 70, "camera travel should interpolate x at midpoint");
assertNear(midFrame.targetYW, 140, "camera travel should interpolate y at midpoint");
assertNear(midFrame.centerXW, 70, "camera center should track interpolated x");
assertNear(midFrame.centerYW, 140, "camera center should track interpolated y");

nowMs = 1000;
const endFrame = camera.resolveFrame({
  targetXW: 120,
  targetYW: 240,
  viewportWidthPx: 20,
  viewportHeightPx: 20,
  worldWidthPx: 400,
  worldHeightPx: 400,
  zoom: 1,
  followMode: "follow_target_center",
  screenAnchorX: 0.5,
  screenAnchorY: 0.5,
  clampLeftXW: 0,
  clampRightXW: 400,
  clampTopYW: 0,
  clampBottomYW: 400,
});

assertNear(endFrame.targetXW, 120, "camera travel should land on destination x");
assertNear(endFrame.targetYW, 240, "camera travel should land on destination y");

camera.requestTravel({
  fromYW: 100,
  toYW: 200,
  durationMs: 1000,
  easing: "linear",
});

nowMs = 1500;
const yOnlyFrame = camera.resolveFrame({
  targetXW: 300,
  targetYW: 200,
  viewportWidthPx: 20,
  viewportHeightPx: 20,
  worldWidthPx: 400,
  worldHeightPx: 400,
  zoom: 1,
  followMode: "follow_target_center",
  screenAnchorX: 0.5,
  screenAnchorY: 0.5,
  clampLeftXW: 0,
  clampRightXW: 400,
  clampTopYW: 0,
  clampBottomYW: 400,
});

assertNear(yOnlyFrame.targetXW, 300, "Y-only travel should preserve caller x target");
assertNear(yOnlyFrame.targetYW, 150, "Y-only travel should still interpolate y");

console.log("camera travel contract ok");
