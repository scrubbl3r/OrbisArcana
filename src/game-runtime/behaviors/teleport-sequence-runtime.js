import { buildTeleportBehaviorConfig } from "./teleport-behavior-state.js?v=20260501a";
import { activateOrbSpawnIdleRuntime } from "./orb-spawn-idle-runtime.js?v=20260501a";

function readOrbY(state = null, fallback = 0) {
  const y = Number(state && state.yW);
  return Number.isFinite(y) ? y : fallback;
}

function readOrbX(state = null, fallback = 0) {
  const x = Number(state && state.xW);
  return Number.isFinite(x) ? x : fallback;
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
  now = () => performance.now(),
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
      vx: 0,
      steerIntentX: 0,
      steerActive: false,
      onGround: false,
      descendMs: 0,
      shieldDescentBlocked: false,
    });
  }

  function play(payload = {}) {
    if (typeof playVisual !== "function") return { handled: false };

    const config = resolveConfig();
    const sourceState = getOrbRuntime();
    const sourceXW = readOrbX(sourceState, 0);
    const sourceYW = readOrbY(sourceState, 0);
    let spawnIdleActivated = false;
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
        const destinationXW = readOrbX(destinationState, sourceXW);
        const destinationYW = readOrbY(destinationState, sourceYW);
        if (config.completionMode === "spawn_idle") {
          const spawnResult = activateOrbSpawnIdleRuntime({
            getOrbRuntime,
            patchOrbRuntime,
            nowMs: typeof now === "function" ? now() : performance.now(),
          });
          spawnIdleActivated = !!(spawnResult && spawnResult.handled);
        } else {
          engageHold(destinationYW);
        }

        const durationMs = Math.max(0, Number(config.cameraTravelMs) || 0);
        if (
          durationMs > 0 &&
          typeof requestCameraTravel === "function" &&
          Math.abs(destinationYW - sourceYW) > 1
        ) {
          try {
            return requestCameraTravel({
              fromXW: sourceXW,
              toXW: destinationXW,
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
        if (config.completionMode !== "spawn_idle") {
          releaseHold(readOrbY(state, sourceYW));
        } else if (!spawnIdleActivated) {
          releaseHold(readOrbY(state, sourceYW));
          activateOrbSpawnIdleRuntime({
            getOrbRuntime,
            patchOrbRuntime,
            nowMs: typeof now === "function" ? now() : performance.now(),
          });
        }
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
