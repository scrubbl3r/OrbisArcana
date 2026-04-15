import { resolveCameraEasing } from "./camera-easing.js";
import { createCameraRuntimeState } from "./camera-runtime-state.js";

function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

  return {
    getState: () => state.get(),
    requestTravel,
    resolveWorldY,
    clearTravel,
  };
}
