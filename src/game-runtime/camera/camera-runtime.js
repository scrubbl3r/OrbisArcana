import { resolveCameraEasing } from "./camera-easing.js";
import { createCameraRuntimeState } from "./camera-runtime-state.js";

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  const n = toFiniteNumber(value, min);
  return Math.max(min, Math.min(max, n));
}

function toOptionalFiniteNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCorridorLoops(cameraBoundaryLoops = []) {
  return (Array.isArray(cameraBoundaryLoops) ? cameraBoundaryLoops : [])
    .map((loop) => (Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [])
      .map((point) => ({
        x: toOptionalFiniteNumber(point && point.xW),
        y: toOptionalFiniteNumber(point && point.yW),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)))
    .filter((points) => points.length >= 3);
}

function isPointInPolygon(point = {}, polygon = []) {
  const x = toFiniteNumber(point.x, 0);
  const y = toFiniteNumber(point.y, 0);
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i] || {};
    const pj = polygon[j] || {};
    const xi = toFiniteNumber(pi.x, 0);
    const yi = toFiniteNumber(pi.y, 0);
    const xj = toFiniteNumber(pj.x, 0);
    const yj = toFiniteNumber(pj.y, 0);
    const intersects = ((yi > y) !== (yj > y))
      && (x < (((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON)) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function nearestPointOnSegment(point = {}, a = {}, b = {}) {
  const px = toFiniteNumber(point.x, 0);
  const py = toFiniteNumber(point.y, 0);
  const ax = toFiniteNumber(a.x, 0);
  const ay = toFiniteNumber(a.y, 0);
  const bx = toFiniteNumber(b.x, ax);
  const by = toFiniteNumber(b.y, ay);
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = (dx * dx) + (dy * dy);
  const t = lenSq > 0 ? clamp((((px - ax) * dx) + ((py - ay) * dy)) / lenSq, 0, 1) : 0;
  const x = ax + (dx * t);
  const y = ay + (dy * t);
  return {
    x,
    y,
    distanceSq: ((px - x) * (px - x)) + ((py - y) * (py - y)),
  };
}

function resolveCameraCorridorCenter(center = {}, loops = []) {
  if (!loops.length) return null;
  for (const loop of loops) {
    if (isPointInPolygon(center, loop)) {
      return {
        x: toFiniteNumber(center.x, 0),
        y: toFiniteNumber(center.y, 0),
        constrained: false,
      };
    }
  }

  let nearest = null;
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i += 1) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const candidate = nearestPointOnSegment(center, a, b);
      if (!nearest || candidate.distanceSq < nearest.distanceSq) nearest = candidate;
    }
  }
  return nearest
    ? { x: nearest.x, y: nearest.y, constrained: true }
    : null;
}

function resolveDeadzonePx(explicitPx, ratio, viewportPx) {
  const directPx = toFiniteNumber(explicitPx, -1);
  if (directPx >= 0) return directPx;
  const safeRatio = clamp(ratio, 0, 1);
  return Math.max(0, safeRatio * Math.max(0, toFiniteNumber(viewportPx, 0)));
}

export function resolveCameraFrame({
  targetXW = 0,
  targetYW = 0,
  viewportWidthPx = 0,
  viewportHeightPx = 0,
  worldWidthPx = 0,
  worldHeightPx = 0,
  zoom = 1,
  followMode = "follow_target_center",
  camLeft = null,
  camTop = null,
  fixedFrameCenterXW = null,
  fixedFrameCenterYW = null,
  screenAnchorX = 0.5,
  screenAnchorY = 0.5,
  deadzoneWidthPx = 0,
  deadzoneHeightPx = 0,
  deadzoneWidthRatio = 0,
  deadzoneHeightRatio = 0,
  followLerpX = 1,
  followLerpY = 1,
  clampLeftXW = 0,
  clampRightXW = null,
  clampTopYW = 0,
  clampBottomYW = null,
  clampInsetLeftPx = 0,
  clampInsetRightPx = 0,
  clampInsetTopPx = 0,
  clampInsetBottomPx = 0,
  cameraBoundaryLoops = [],
  target = null,
} = {}) {
  const resolvedZoom = Math.max(0.01, toFiniteNumber(zoom, 1));
  const safeViewportWidthPx = Math.max(1, toFiniteNumber(viewportWidthPx, 0));
  const safeViewportHeightPx = Math.max(1, toFiniteNumber(viewportHeightPx, 0));
  const safeWorldWidthPx = Math.max(1, toFiniteNumber(worldWidthPx, safeViewportWidthPx));
  const safeWorldHeightPx = Math.max(1, toFiniteNumber(worldHeightPx, safeViewportHeightPx));
  const viewportWorldWidth = safeViewportWidthPx / resolvedZoom;
  const viewportWorldHeight = safeViewportHeightPx / resolvedZoom;
  const safeScreenAnchorX = clamp(screenAnchorX, 0, 1);
  const safeScreenAnchorY = clamp(screenAnchorY, 0, 1);
  const safeClampLeftXW = toFiniteNumber(clampLeftXW, 0);
  const safeClampRightXW = toFiniteNumber(clampRightXW, safeWorldWidthPx);
  const safeClampTopYW = toFiniteNumber(clampTopYW, 0);
  const safeClampBottomYW = toFiniteNumber(clampBottomYW, safeWorldHeightPx);
  const cameraCorridorLoops = normalizeCorridorLoops(cameraBoundaryLoops);
  const hasCameraCorridor = cameraCorridorLoops.length > 0;
  const safeClampInsetLeftW = Math.max(0, toFiniteNumber(clampInsetLeftPx, 0)) / resolvedZoom;
  const safeClampInsetRightW = Math.max(0, toFiniteNumber(clampInsetRightPx, 0)) / resolvedZoom;
  const safeClampInsetTopW = Math.max(0, toFiniteNumber(clampInsetTopPx, 0)) / resolvedZoom;
  const safeClampInsetBottomW = Math.max(0, toFiniteNumber(clampInsetBottomPx, 0)) / resolvedZoom;
  const worldMinCamLeft = 0;
  const worldMaxCamLeft = Math.max(0, safeWorldWidthPx - viewportWorldWidth);
  const worldMinCamTop = 0;
  const worldMaxCamTop = Math.max(0, safeWorldHeightPx - viewportWorldHeight);
  const minCamLeft = clamp(
    safeClampLeftXW - safeClampInsetLeftW,
    worldMinCamLeft,
    worldMaxCamLeft
  );
  const maxCamLeft = clamp(
    (safeClampRightXW + safeClampInsetRightW) - viewportWorldWidth,
    minCamLeft,
    worldMaxCamLeft
  );
  const minCamTop = clamp(
    safeClampTopYW - safeClampInsetTopW,
    worldMinCamTop,
    worldMaxCamTop
  );
  const maxCamTop = clamp(
    (safeClampBottomYW + safeClampInsetBottomW) - viewportWorldHeight,
    minCamTop,
    worldMaxCamTop
  );
  const frameMinCamLeft = hasCameraCorridor ? worldMinCamLeft : minCamLeft;
  const frameMaxCamLeft = hasCameraCorridor ? worldMaxCamLeft : maxCamLeft;
  const frameMinCamTop = hasCameraCorridor ? worldMinCamTop : minCamTop;
  const frameMaxCamTop = hasCameraCorridor ? worldMaxCamTop : maxCamTop;
  const safeTargetXW = toFiniteNumber(targetXW, 0);
  const safeTargetYW = toFiniteNumber(targetYW, 0);
  const safeFollowMode = String(followMode || "follow_target_center").trim().toLowerCase();
  const safeFixedFrameCenterXW = toFiniteNumber(fixedFrameCenterXW, safeTargetXW);
  const safeFixedFrameCenterYW = toFiniteNumber(fixedFrameCenterYW, safeTargetYW);
  const resolvedDeadzoneWidthPx = resolveDeadzonePx(deadzoneWidthPx, deadzoneWidthRatio, safeViewportWidthPx);
  const resolvedDeadzoneHeightPx = resolveDeadzonePx(deadzoneHeightPx, deadzoneHeightRatio, safeViewportHeightPx);
  const deadzoneWorldWidth = Math.max(0, resolvedDeadzoneWidthPx / resolvedZoom);
  const deadzoneWorldHeight = Math.max(0, resolvedDeadzoneHeightPx / resolvedZoom);
  const safeFollowLerpX = clamp(followLerpX, 0, 1);
  const safeFollowLerpY = clamp(followLerpY, 0, 1);
  const hasCurrentCamLeft = camLeft != null && Number.isFinite(Number(camLeft));
  const hasCurrentCamTop = camTop != null && Number.isFinite(Number(camTop));

  let resolvedCamLeft = clamp(toOptionalFiniteNumber(camLeft), frameMinCamLeft, frameMaxCamLeft);
  let resolvedCamTop = clamp(toOptionalFiniteNumber(camTop), frameMinCamTop, frameMaxCamTop);
  if (safeFollowMode === "fixed_frame") {
    resolvedCamLeft = clamp(safeFixedFrameCenterXW - (viewportWorldWidth * safeScreenAnchorX), frameMinCamLeft, frameMaxCamLeft);
    resolvedCamTop = clamp(safeFixedFrameCenterYW - (viewportWorldHeight * safeScreenAnchorY), frameMinCamTop, frameMaxCamTop);
  } else if (safeFollowMode === "follow_target_soft") {
    const currentCenterXW = resolvedCamLeft + (viewportWorldWidth * safeScreenAnchorX);
    const currentCenterYW = resolvedCamTop + (viewportWorldHeight * safeScreenAnchorY);
    const zoneHalfW = deadzoneWorldWidth * 0.5;
    const zoneHalfH = deadzoneWorldHeight * 0.5;
    let nextCenterXW = currentCenterXW;
    let nextCenterYW = currentCenterYW;

    if (safeTargetXW < (currentCenterXW - zoneHalfW)) {
      nextCenterXW = safeTargetXW + zoneHalfW;
    } else if (safeTargetXW > (currentCenterXW + zoneHalfW)) {
      nextCenterXW = safeTargetXW - zoneHalfW;
    }

    if (safeTargetYW < (currentCenterYW - zoneHalfH)) {
      nextCenterYW = safeTargetYW + zoneHalfH;
    } else if (safeTargetYW > (currentCenterYW + zoneHalfH)) {
      nextCenterYW = safeTargetYW - zoneHalfH;
    }

    const desiredCamLeft = clamp(nextCenterXW - (viewportWorldWidth * safeScreenAnchorX), frameMinCamLeft, frameMaxCamLeft);
    const desiredCamTop = clamp(nextCenterYW - (viewportWorldHeight * safeScreenAnchorY), frameMinCamTop, frameMaxCamTop);
    resolvedCamLeft = hasCurrentCamLeft
      ? clamp(resolvedCamLeft + ((desiredCamLeft - resolvedCamLeft) * safeFollowLerpX), frameMinCamLeft, frameMaxCamLeft)
      : desiredCamLeft;
    resolvedCamTop = hasCurrentCamTop
      ? clamp(resolvedCamTop + ((desiredCamTop - resolvedCamTop) * safeFollowLerpY), frameMinCamTop, frameMaxCamTop)
      : desiredCamTop;
  } else {
    resolvedCamLeft = clamp(safeTargetXW - (viewportWorldWidth * safeScreenAnchorX), frameMinCamLeft, frameMaxCamLeft);
    resolvedCamTop = clamp(safeTargetYW - (viewportWorldHeight * safeScreenAnchorY), frameMinCamTop, frameMaxCamTop);
  }

  let centerXW = resolvedCamLeft + (viewportWorldWidth * safeScreenAnchorX);
  let centerYW = resolvedCamTop + (viewportWorldHeight * safeScreenAnchorY);
  const corridorCenter = resolveCameraCorridorCenter({ x: centerXW, y: centerYW }, cameraCorridorLoops);
  if (corridorCenter && corridorCenter.constrained) {
    centerXW = corridorCenter.x;
    centerYW = corridorCenter.y;
    resolvedCamLeft = clamp(centerXW - (viewportWorldWidth * safeScreenAnchorX), worldMinCamLeft, worldMaxCamLeft);
    resolvedCamTop = clamp(centerYW - (viewportWorldHeight * safeScreenAnchorY), worldMinCamTop, worldMaxCamTop);
    centerXW = resolvedCamLeft + (viewportWorldWidth * safeScreenAnchorX);
    centerYW = resolvedCamTop + (viewportWorldHeight * safeScreenAnchorY);
  }
  const frame = target || {};
  frame.followMode = safeFollowMode;
  frame.zoom = resolvedZoom;
  frame.viewportWidthPx = safeViewportWidthPx;
  frame.viewportHeightPx = safeViewportHeightPx;
  frame.viewportWorldWidth = viewportWorldWidth;
  frame.viewportWorldHeight = viewportWorldHeight;
  frame.worldWidthPx = safeWorldWidthPx;
  frame.worldHeightPx = safeWorldHeightPx;
  frame.targetXW = safeTargetXW;
  frame.targetYW = safeTargetYW;
  frame.camLeft = resolvedCamLeft;
  frame.camTop = resolvedCamTop;
  frame.centerXW = centerXW;
  frame.centerYW = centerYW;
  frame.targetScreenX = (safeTargetXW - resolvedCamLeft) * resolvedZoom;
  frame.targetScreenY = (safeTargetYW - resolvedCamTop) * resolvedZoom;
  frame.screenAnchorX = safeScreenAnchorX;
  frame.screenAnchorY = safeScreenAnchorY;
  frame.deadzoneWidthPx = resolvedDeadzoneWidthPx;
  frame.deadzoneHeightPx = resolvedDeadzoneHeightPx;
  frame.deadzoneWidthRatio = clamp(deadzoneWidthRatio, 0, 1);
  frame.deadzoneHeightRatio = clamp(deadzoneHeightRatio, 0, 1);
  frame.followLerpX = safeFollowLerpX;
  frame.followLerpY = safeFollowLerpY;
  frame.clampLeftXW = safeClampLeftXW;
  frame.clampRightXW = safeClampRightXW;
  frame.clampTopYW = safeClampTopYW;
  frame.clampBottomYW = safeClampBottomYW;
  frame.clampInsetLeftPx = toFiniteNumber(clampInsetLeftPx, 0);
  frame.clampInsetRightPx = toFiniteNumber(clampInsetRightPx, 0);
  frame.clampInsetTopPx = toFiniteNumber(clampInsetTopPx, 0);
  frame.clampInsetBottomPx = toFiniteNumber(clampInsetBottomPx, 0);
  frame.cameraCorridorConstrained = Boolean(corridorCenter && corridorCenter.constrained);
  frame.fixedFrameCenterXW = safeFixedFrameCenterXW;
  frame.fixedFrameCenterYW = safeFixedFrameCenterYW;
  return target ? frame : Object.freeze(frame);
}

export function createCameraRuntime({
  now = () => performance.now(),
  state = createCameraRuntimeState(),
} = {}) {
  function reset() {
    state.reset();
    return state.get();
  }

  function clearTravel(result = { handled: false, canceled: true }) {
    const runtimeState = state.get();
    const travel = runtimeState.activeTravel;
    runtimeState.activeTravel = null;
    if (travel && typeof travel.resolve === "function") {
      const resolve = travel.resolve;
      travel.resolve = null;
      resolve(result);
    }
  }

  function requestTravel({
    fromXW = null,
    toXW = null,
    fromYW = 0,
    toYW = 0,
    durationMs = 1500,
    easing = "easeInOutExpo",
  } = {}) {
    clearTravel({ handled: false, canceled: true });
    return new Promise((resolve) => {
      state.get().activeTravel = {
        fromXW: toOptionalFiniteNumber(fromXW),
        toXW: toOptionalFiniteNumber(toXW),
        fromYW: toFiniteNumber(fromYW, 0),
        toYW: toFiniteNumber(toYW, 0),
        durationMs: Math.max(0, toFiniteNumber(durationMs, 1500)),
        startMs: now(),
        ease: resolveCameraEasing(easing),
        resolve,
      };
    });
  }

  function resolveWorldTarget({ baselineXW = 0, baselineYW = 0, nowMs = now() } = {}) {
    const runtimeState = state.get();
    const travel = runtimeState.activeTravel;
    const safeBaselineXW = toFiniteNumber(baselineXW, 0);
    const safeBaselineYW = toFiniteNumber(baselineYW, 0);
    if (!travel) {
      return Object.freeze({
        xW: safeBaselineXW,
        yW: safeBaselineYW,
        traveling: false,
      });
    }
    const durationMs = Math.max(1, toFiniteNumber(travel.durationMs, 1));
    const rawT = Math.max(0, Math.min(1, (toFiniteNumber(nowMs, 0) - toFiniteNumber(travel.startMs, 0)) / durationMs));
    const easedT = typeof travel.ease === "function" ? travel.ease(rawT) : rawT;
    const fromXW = toOptionalFiniteNumber(travel.fromXW);
    const toXW = toOptionalFiniteNumber(travel.toXW);
    const fromYW = toFiniteNumber(travel.fromYW, 0);
    const toYW = toFiniteNumber(travel.toYW, 0);
    const resolvedXW = fromXW != null && toXW != null
      ? fromXW + ((toXW - fromXW) * easedT)
      : safeBaselineXW;
    const resolvedYW = fromYW + ((toYW - fromYW) * easedT);
    if (rawT >= 1) {
      runtimeState.activeTravel = null;
      if (typeof travel.resolve === "function") {
        const resolve = travel.resolve;
        travel.resolve = null;
        resolve({ handled: true, xW: fromXW != null && toXW != null ? toXW : safeBaselineXW, yW: toYW });
      }
    }
    return Object.freeze({
      xW: rawT >= 1 && fromXW != null && toXW != null ? toXW : resolvedXW,
      yW: rawT >= 1 ? toYW : resolvedYW,
      traveling: true,
    });
  }

  function resolveWorldY({ baselineYW = 0, nowMs = now() } = {}) {
    return resolveWorldTarget({ baselineYW, nowMs }).yW;
  }

  function resolveFrame({
    targetXW = 0,
    targetYW = 0,
    viewportWidthPx = 0,
    viewportHeightPx = 0,
    worldWidthPx = 0,
    worldHeightPx = 0,
    zoom = 1,
    followMode = "follow_target_center",
    camLeft = null,
    camTop = null,
    fixedFrameCenterXW = null,
    fixedFrameCenterYW = null,
    screenAnchorX = 0.5,
    screenAnchorY = 0.5,
    deadzoneWidthPx = 0,
    deadzoneHeightPx = 0,
    deadzoneWidthRatio = 0,
    deadzoneHeightRatio = 0,
    followLerpX = 1,
    followLerpY = 1,
    clampLeftXW = 0,
    clampRightXW = null,
    clampTopYW = 0,
    clampBottomYW = null,
    clampInsetLeftPx = 0,
    clampInsetRightPx = 0,
    clampInsetTopPx = 0,
    clampInsetBottomPx = 0,
    cameraBoundaryLoops = [],
    nowMs = now(),
    target = null,
  } = {}) {
    const previousFrame = state.get().lastResolvedFrame;
    const effectiveTarget = resolveWorldTarget({ baselineXW: targetXW, baselineYW: targetYW, nowMs });
    const frame = resolveCameraFrame({
      targetXW: effectiveTarget.xW,
      targetYW: effectiveTarget.yW,
      viewportWidthPx,
      viewportHeightPx,
      worldWidthPx,
      worldHeightPx,
      zoom,
      followMode: effectiveTarget.traveling ? "follow_target_center" : followMode,
      camLeft: camLeft != null ? camLeft : (previousFrame && previousFrame.camLeft),
      camTop: camTop != null ? camTop : (previousFrame && previousFrame.camTop),
      fixedFrameCenterXW,
      fixedFrameCenterYW,
      screenAnchorX,
      screenAnchorY,
      deadzoneWidthPx,
      deadzoneHeightPx,
      deadzoneWidthRatio,
      deadzoneHeightRatio,
      followLerpX: effectiveTarget.traveling ? 1 : followLerpX,
      followLerpY: effectiveTarget.traveling ? 1 : followLerpY,
      clampLeftXW,
      clampRightXW,
      clampTopYW,
      clampBottomYW,
      clampInsetLeftPx,
      clampInsetRightPx,
      clampInsetTopPx,
      clampInsetBottomPx,
      cameraBoundaryLoops,
      target,
    });
    state.get().lastResolvedFrame = frame;
    return frame;
  }

  return {
    getState: () => state.get(),
    reset,
    requestTravel,
    resolveWorldTarget,
    resolveWorldY,
    resolveFrame,
    clearTravel,
  };
}
