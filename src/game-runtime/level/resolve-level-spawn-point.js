import {
  LEVEL_POINT_Y_MODE_FALLBACK,
  LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET,
} from "./normalize-level-definition.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveLevelPointSpec(
  pointSpec = null,
  {
    worldWidthPx = 0,
    groundCenterWorld = () => 0,
  } = {}
) {
  const point = pointSpec && typeof pointSpec === "object" ? pointSpec : null;
  if (!point) return null;

  const xW = Number.isFinite(Number(point.xW))
    ? Number(point.xW)
    : (
        Number.isFinite(Number(point.xNorm))
          ? (Math.max(0, clampNumber(point.xNorm, 0)) * Math.max(0, clampNumber(worldWidthPx, 0)))
          : null
      );

  const yMode = String(point.yMode || LEVEL_POINT_Y_MODE_FALLBACK).trim().toLowerCase();
  let yW = null;

  if (Number.isFinite(Number(point.yW))) {
    yW = Number(point.yW);
  } else if (yMode === LEVEL_POINT_Y_MODE_GROUND_CENTER_OFFSET) {
    yW = Number(groundCenterWorld()) + clampNumber(point.yValue, 0);
  } else if (Number.isFinite(Number(point.yValue))) {
    yW = Number(point.yValue);
  }

  if (!Number.isFinite(xW) || !Number.isFinite(yW)) return null;

  return Object.freeze({
    xW: Number(xW),
    yW: Number(yW),
  });
}

export function resolveLevelSpawnPoint(level = null, options = {}) {
  const spawn = level && typeof level.spawn === "object" ? level.spawn : null;
  return resolveLevelPointSpec(spawn, options);
}

export function resolveLevelCameraAnchor(
  level = null,
  anchorId = "",
  {
    worldWidthPx = 0,
    groundCenterWorld = () => 0,
    svgAnchors = [],
  } = {}
) {
  const normalizedAnchorId = String(anchorId || "").trim();
  if (!normalizedAnchorId) return null;

  const svgAnchor = Array.isArray(svgAnchors)
    ? svgAnchors.find((anchor) => String(anchor && anchor.id || "").trim() === normalizedAnchorId)
    : null;
  if (svgAnchor && svgAnchor.worldCenter) {
    return Object.freeze({
      id: normalizedAnchorId,
      point: Object.freeze({
        xW: clampNumber(svgAnchor.worldCenter.xW, 0),
        yW: clampNumber(svgAnchor.worldCenter.yW, 0),
      }),
      source: "svg",
    });
  }

  const authoredAnchors = Array.isArray(level && level.cameraAnchors) ? level.cameraAnchors : [];
  const authoredAnchor = authoredAnchors.find((anchor) => String(anchor && anchor.id || "").trim() === normalizedAnchorId);
  const point = resolveLevelPointSpec(authoredAnchor, {
    worldWidthPx,
    groundCenterWorld,
  });
  if (!point) return null;

  return Object.freeze({
    id: normalizedAnchorId,
    point,
    source: "content",
  });
}
