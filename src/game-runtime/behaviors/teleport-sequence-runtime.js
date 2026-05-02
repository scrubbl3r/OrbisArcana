import { buildTeleportBehaviorConfig } from "./teleport-behavior-state.js";

function readOrbY(state = null, fallback = 0) {
  const y = Number(state && state.yW);
  return Number.isFinite(y) ? y : fallback;
}

function isHandled(result = null) {
  return !!(result && result.handled);
}

export function createTeleportSequenceRuntime({
  getOrbRuntime = () => null,
  patchOrbRuntime = () => null,
  requestCameraTravel = null,
  cancelCameraTravel = null,
  getConfig = () => Object.create(null),
  playVisual = null,
} = {}) {
  function resolveConfig() {
    const raw = typeof getConfig === "function" ? getConfig() : null;
    return Object.freeze({
      ...(raw && typeof raw === "object" ? raw : Object.create(null)),
      ...buildTeleportBehaviorConfig(raw),
    });
  }

  function releaseHold(anchorY = 0) {
    patchOrbRuntime({
      teleportHoldActive: false,
      teleportHoldAnchorY: anchorY,
      v: 0,
    });
  }

  function engageHold(anchorY = 0) {
    patchOrbRuntime({
      teleportHoldActive: true,
      teleportHoldAnchorY: anchorY,
      v: 0,
      onGround: false,
      descendMs: 0,
      shieldDescentBlocked: false,
    });
  }

  function play(payload = {}) {
    if (typeof playVisual !== "function") return { handled: false };

    const config = resolveConfig();
    const sourceState = getOrbRuntime();
    const sourceYW = readOrbY(sourceState, 0);
    engageHold(sourceYW);

    const result = playVisual({
      ...payload,
      config,
      onTeleport: () => {
        let teleportResult = null;
        if (typeof payload.onTeleport === "function") {
          try {
            teleportResult = payload.onTeleport();
          } catch (_) {}
        }

        const destinationState = getOrbRuntime();
        const destinationYW = readOrbY(destinationState, sourceYW);
        engageHold(destinationYW);

        const durationMs = Math.max(0, Number(config.cameraTravelMs) || 0);
        if (
          durationMs > 0 &&
          typeof requestCameraTravel === "function" &&
          Math.abs(destinationYW - sourceYW) > 1
        ) {
          try {
            return requestCameraTravel({
              fromYW: sourceYW,
              toYW: destinationYW,
              durationMs,
              easing: config.cameraEasing,
            });
          } catch (_) {}
        }

        return teleportResult;
      },
      onComplete: () => {
        const state = getOrbRuntime();
        releaseHold(readOrbY(state, sourceYW));
        if (typeof payload.onComplete === "function") {
          try {
            payload.onComplete();
          } catch (_) {}
        }
      },
    });

    if (isHandled(result)) return result;
    releaseHold(sourceYW);
    return result || { handled: false };
  }

  function clear() {
    if (typeof cancelCameraTravel === "function") {
      try {
        cancelCameraTravel();
      } catch (_) {}
    }
    const state = getOrbRuntime();
    releaseHold(readOrbY(state, 0));
  }

  return Object.freeze({
    play,
    clear,
  });
}
