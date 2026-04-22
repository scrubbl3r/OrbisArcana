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

export function resolveCameraFrame({
  targetXW = 0,
  targetYW = 0,
  viewportWidthPx = 0,
  viewportHeightPx = 0,
  worldWidthPx = 0,
  worldHeightPx = 0,
  zoom = 1,
  followMode = "follow_target_center",
  camLeft = 0,
  camTop = 0,
} = {}) {
  const resolvedZoom = Math.max(0.01, toFiniteNumber(zoom, 1));
  const safeViewportWidthPx = Math.max(1, toFiniteNumber(viewportWidthPx, 0));
  const safeViewportHeightPx = Math.max(1, toFiniteNumber(viewportHeightPx, 0));
  const safeWorldWidthPx = Math.max(1, toFiniteNumber(worldWidthPx, safeViewportWidthPx));
  const safeWorldHeightPx = Math.max(1, toFiniteNumber(worldHeightPx, safeViewportHeightPx));
  const viewportWorldWidth = safeViewportWidthPx / resolvedZoom;
  const viewportWorldHeight = safeViewportHeightPx / resolvedZoom;
  const maxCamLeft = Math.max(0, safeWorldWidthPx - viewportWorldWidth);
  const maxCamTop = Math.max(0, safeWorldHeightPx - viewportWorldHeight);
  const safeTargetXW = toFiniteNumber(targetXW, 0);
  const safeTargetYW = toFiniteNumber(targetYW, 0);

  let resolvedCamLeft = clamp(camLeft, 0, maxCamLeft);
  let resolvedCamTop = clamp(camTop, 0, maxCamTop);
  if (String(followMode || "").trim().toLowerCase() !== "fixed_frame") {
    resolvedCamLeft = clamp(safeTargetXW - (viewportWorldWidth * 0.5), 0, maxCamLeft);
    resolvedCamTop = clamp(safeTargetYW - (viewportWorldHeight * 0.5), 0, maxCamTop);
  }

  const centerXW = resolvedCamLeft + (viewportWorldWidth * 0.5);
  const centerYW = resolvedCamTop + (viewportWorldHeight * 0.5);
  return Object.freeze({
    followMode: String(followMode || "follow_target_center"),
    zoom: resolvedZoom,
    viewportWidthPx: safeViewportWidthPx,
    viewportHeightPx: safeViewportHeightPx,
    viewportWorldWidth,
    viewportWorldHeight,
    worldWidthPx: safeWorldWidthPx,
    worldHeightPx: safeWorldHeightPx,
    targetXW: safeTargetXW,
    targetYW: safeTargetYW,
    camLeft: resolvedCamLeft,
    camTop: resolvedCamTop,
    centerXW,
    centerYW,
    targetScreenX: (safeTargetXW - resolvedCamLeft) * resolvedZoom,
    targetScreenY: (safeTargetYW - resolvedCamTop) * resolvedZoom,
  });
}

export function createCameraRuntime({
  now = () => performance.now(),
  state = createCameraRuntimeState(),
} = {}) {
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
    fromYW = 0,
    toYW = 0,
    durationMs = 1500,
    easing = "easeInOutExpo",
  } = {}) {
    clearTravel({ handled: false, canceled: true });
    return new Promise((resolve) => {
      state.get().activeTravel = {
        fromYW: toFiniteNumber(fromYW, 0),
        toYW: toFiniteNumber(toYW, 0),
        durationMs: Math.max(0, toFiniteNumber(durationMs, 1500)),
        startMs: now(),
        ease: resolveCameraEasing(easing),
        resolve,
      };
    });
  }

  function resolveWorldY({ baselineYW = 0, nowMs = now() } = {}) {
    const runtimeState = state.get();
    const travel = runtimeState.activeTravel;
    if (!travel) return toFiniteNumber(baselineYW, 0);
    const durationMs = Math.max(1, toFiniteNumber(travel.durationMs, 1));
    const rawT = Math.max(0, Math.min(1, (toFiniteNumber(nowMs, 0) - toFiniteNumber(travel.startMs, 0)) / durationMs));
    const easedT = typeof travel.ease === "function" ? travel.ease(rawT) : rawT;
    const fromYW = toFiniteNumber(travel.fromYW, 0);
    const toYW = toFiniteNumber(travel.toYW, 0);
    let resolvedYW = fromYW + ((toYW - fromYW) * easedT);
    if (rawT >= 1) {
      resolvedYW = toYW;
      runtimeState.activeTravel = null;
      if (typeof travel.resolve === "function") {
        const resolve = travel.resolve;
        travel.resolve = null;
        resolve({ handled: true, yW: resolvedYW });
      }
    }
    return resolvedYW;
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
    camLeft = 0,
    camTop = 0,
    nowMs = now(),
  } = {}) {
    const effectiveTargetYW = resolveWorldY({ baselineYW: targetYW, nowMs });
    const frame = resolveCameraFrame({
      targetXW,
      targetYW: effectiveTargetYW,
      viewportWidthPx,
      viewportHeightPx,
      worldWidthPx,
      worldHeightPx,
      zoom,
      followMode,
      camLeft,
      camTop,
    });
    state.get().lastResolvedFrame = frame;
    return frame;
  }

  return {
    getState: () => state.get(),
    requestTravel,
    resolveWorldY,
    resolveFrame,
    clearTravel,
  };
}
