import { resolveLevelCameraAnchor } from "./resolve-level-spawn-point.js";
import {
  LEVEL_CAMERA_FOLLOW_MODE_FALLBACK,
  LEVEL_CAMERA_MODE_GAMEPLAY,
  LEVEL_CAMERA_MODE_PREVIEW,
} from "./normalize-level-definition.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveStageCameraZoom(level = null, mode = LEVEL_CAMERA_MODE_GAMEPLAY, fallback = 1) {
  const camera = level && typeof level.camera === "object" ? level.camera : null;
  const stage = level && typeof level.stage === "object" ? level.stage : null;
  const key = mode === LEVEL_CAMERA_MODE_PREVIEW ? "previewZoom" : "gameplayZoom";
  return Math.max(
    0.05,
    clampNumber(camera && camera[key], 0) ||
    clampNumber(stage && stage[key], 0) ||
    fallback
  );
}

export function resolveStageCameraFollowMode(level = null, mode = LEVEL_CAMERA_MODE_GAMEPLAY, fallback = LEVEL_CAMERA_FOLLOW_MODE_FALLBACK) {
  const camera = level && typeof level.camera === "object" ? level.camera : null;
  const key = mode === LEVEL_CAMERA_MODE_PREVIEW ? "previewFollowMode" : "gameplayFollowMode";
  return String((camera && camera[key]) || fallback).trim();
}

export function resolveStageCameraConfig(level = null, {
  mode = LEVEL_CAMERA_MODE_GAMEPLAY,
  worldWidthPx = 0,
  worldHeightPx = 0,
  cameraAnchors = [],
  groundCenterWorld = () => Math.max(0, clampNumber(worldHeightPx, 0)) * 0.5,
} = {}) {
  const camera = level && typeof level.camera === "object" ? level.camera : null;
  const fixedFrameAnchor = resolveLevelCameraAnchor(level, camera && camera.fixedFrameAnchorId, {
    worldWidthPx,
    groundCenterWorld,
    svgAnchors: cameraAnchors,
  });
  return Object.freeze({
    fixedFrameCenterXW: fixedFrameAnchor && fixedFrameAnchor.point
      ? fixedFrameAnchor.point.xW
      : (
          camera && camera.fixedFrameCenterXW != null && Number.isFinite(Number(camera.fixedFrameCenterXW))
            ? Number(camera.fixedFrameCenterXW)
            : null
        ),
    fixedFrameCenterYW: fixedFrameAnchor && fixedFrameAnchor.point
      ? fixedFrameAnchor.point.yW
      : (
          camera && camera.fixedFrameCenterYW != null && Number.isFinite(Number(camera.fixedFrameCenterYW))
            ? Number(camera.fixedFrameCenterYW)
            : null
        ),
    deadzoneWidthPx: Number(camera && camera.deadzoneWidthPx) >= 0 ? Number(camera.deadzoneWidthPx) : -1,
    deadzoneHeightPx: Number(camera && camera.deadzoneHeightPx) >= 0 ? Number(camera.deadzoneHeightPx) : -1,
    deadzoneWidthRatio: Math.max(0, clampNumber(camera && camera.deadzoneWidthRatio, 0)),
    deadzoneHeightRatio: Math.max(0, clampNumber(camera && camera.deadzoneHeightRatio, 0)),
    followLerpX: Math.max(0, Math.min(1, clampNumber(camera && camera.followLerpX, 1))),
    followLerpY: Math.max(0, Math.min(1, clampNumber(camera && camera.followLerpY, 1))),
    screenAnchorX: Number(camera && camera.screenAnchorX) >= 0 ? Number(camera.screenAnchorX) : 0.5,
    screenAnchorY: Number(camera && camera.screenAnchorY) >= 0 ? Number(camera.screenAnchorY) : 0.5,
    clampInsetLeftPx: Number(camera && camera.clampInsetLeftPx) >= 0 ? Number(camera.clampInsetLeftPx) : 0,
    clampInsetRightPx: Number(camera && camera.clampInsetRightPx) >= 0 ? Number(camera.clampInsetRightPx) : 0,
    clampInsetTopPx: Number(camera && camera.clampInsetTopPx) >= 0 ? Number(camera.clampInsetTopPx) : 0,
    clampInsetBottomPx: Number(camera && camera.clampInsetBottomPx) >= 0 ? Number(camera.clampInsetBottomPx) : 0,
    mode,
  });
}

export function resolveStageCameraClampBounds({
  worldWidthPx = 0,
  worldHeightPx = 0,
  cameraBoundaryBox = null,
  boundaryBox = null,
} = {}) {
  if (cameraBoundaryBox) {
    return Object.freeze({
      leftXW: clampNumber(cameraBoundaryBox.leftXW, 0),
      rightXW: clampNumber(cameraBoundaryBox.rightXW, worldWidthPx),
      topYW: clampNumber(cameraBoundaryBox.topYW, 0),
      bottomYW: clampNumber(cameraBoundaryBox.bottomYW, worldHeightPx) || worldHeightPx,
    });
  }
  if (boundaryBox) {
    return Object.freeze({
      leftXW: clampNumber(boundaryBox.leftXW, 0),
      rightXW: clampNumber(boundaryBox.rightXW, worldWidthPx),
      topYW: clampNumber(boundaryBox.topYW, 0),
      bottomYW: clampNumber(boundaryBox.bottomYW, worldHeightPx) || worldHeightPx,
    });
  }
  return Object.freeze({
    leftXW: 0,
    rightXW: worldWidthPx,
    topYW: 0,
    bottomYW: worldHeightPx,
  });
}
