import { createOrb3dRuntime } from "./orb-3d-runtime.js?v=20260501c";
import {
  createOrbNod3dRuntime,
  createOrbNod3dSurfaceDisplacementConfig,
} from "./orb-nod-3d-runtime.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampRange(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function buildFlickerMask(elapsedMs, onMs, offMs) {
  const cycleMs = Math.max(1, Number(onMs) + Number(offMs));
  const phaseMs = ((Number(elapsedMs) % cycleMs) + cycleMs) % cycleMs;
  return phaseMs < Number(onMs) ? 1 : 0;
}

export function createOrb3dActorRuntime({
  parent = null,
  fallbackBo = 72,
  getDefaultZBO = () => 1,
  toRuntimePosition = ({ x = 0, y = 0, z = 0 } = {}) => ({ x, y, z }),
  applyMeshFlags = () => {},
  onTelemetry = () => {},
  onModelChanged = () => {},
  onNeedsFrame = () => {},
} = {}) {
  let orbRuntime = null;
  let nodRuntime = null;
  let bo = 0;
  let zBO = Math.max(0, clampNumber(typeof getDefaultZBO === "function" ? getDefaultZBO() : getDefaultZBO, 1));
  let depth = zBO * Math.max(1, Number(fallbackBo) || 72);
  let position = Object.freeze({ x: 0, y: 0, z: -depth });
  let teleportRaf = 0;
  let teleportPlayToken = 0;

  function notifyModelChanged() {
    if (typeof onModelChanged === "function") onModelChanged(getModel());
  }

  function publishTelemetry() {
    if (typeof onTelemetry !== "function") return;
    onTelemetry({
      bo: getBo(),
      zBO,
      depthPx: depth,
    });
  }

  function disposeModel() {
    clearTeleport();
    if (nodRuntime && typeof nodRuntime.dispose === "function") nodRuntime.dispose();
    nodRuntime = null;
    if (orbRuntime && typeof orbRuntime.dispose === "function") orbRuntime.dispose();
    orbRuntime = null;
    bo = 0;
    notifyModelChanged();
  }

  function getBo() {
    return bo || Math.max(1, Number(fallbackBo) || 72);
  }

  function getModel() {
    return orbRuntime && orbRuntime.model ? orbRuntime.model : null;
  }

  function ensureModel(nextBo) {
    const resolvedBO = Math.max(1, Number(nextBo) || Number(fallbackBo) || 72);
    if (orbRuntime && Math.abs(resolvedBO - bo) <= 0.001) return;
    disposeModel();
    orbRuntime = createOrb3dRuntime({
      bo: resolvedBO,
      includeCore: false,
      includeRibs: false,
      surfaceDisplacement: createOrbNod3dSurfaceDisplacementConfig(Object.create(null), {
        enabled: false,
      }),
    });
    nodRuntime = createOrbNod3dRuntime({
      getMaterial: () => orbRuntime && orbRuntime.shellMaterial,
      getBo: () => bo || resolvedBO,
    });
    bo = resolvedBO;
    if (orbRuntime.model) {
      applyMeshFlags(orbRuntime.model, {
        receiveShadow: false,
        castShadow: false,
      });
      if (parent && typeof parent.add === "function") parent.add(orbRuntime.model);
    }
    if (orbRuntime.shadowSpot && parent && typeof parent.add === "function") {
      parent.add(orbRuntime.shadowSpot);
    }
    notifyModelChanged();
  }

  function setWorldPosition({
    xW = null,
    yW = null,
    bo: nextBo = fallbackBo,
    zBO: nextZBO = typeof getDefaultZBO === "function" ? getDefaultZBO() : zBO,
  } = {}) {
    const worldX = Number(xW);
    const worldY = Number(yW);
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return false;
    ensureModel(nextBo);
    zBO = Math.max(0, Number.isFinite(Number(nextZBO)) ? Number(nextZBO) : zBO);
    depth = zBO * getBo();
    const runtimePosition = typeof toRuntimePosition === "function"
      ? (toRuntimePosition({ x: worldX, y: worldY, z: -depth, bo: getBo(), zBO }) || {})
      : {};
    position = Object.freeze({
      x: Number(runtimePosition.x) || 0,
      y: Number(runtimePosition.y) || 0,
      z: Number(runtimePosition.z) || -depth,
    });
    if (orbRuntime && typeof orbRuntime.setPosition === "function") {
      orbRuntime.setPosition(position);
    }
    publishTelemetry();
    if (typeof onNeedsFrame === "function") onNeedsFrame();
    return true;
  }

  function update(timeSec = 0) {
    if (orbRuntime && typeof orbRuntime.setTime === "function") {
      orbRuntime.setTime(timeSec);
    }
    if (nodRuntime && typeof nodRuntime.update === "function") {
      nodRuntime.update(timeSec);
    }
  }

  function normalizeTeleportConfig(raw = {}) {
    return Object.freeze({
      flickerOnMs: Math.round(clampRange(raw.flickerOnMs ?? raw.orbTeleportFlickerOnMs, 10, 1000, 60)),
      flickerOffMs: Math.round(clampRange(raw.flickerOffMs ?? raw.orbTeleportFlickerOffMs, 10, 1000, 60)),
      fadeOutMs: Math.round(clampRange(raw.fadeOutMs ?? raw.orbTeleportFadeOutMs, 40, 4000, 280)),
      cameraTravelMs: Math.round(clampRange(raw.cameraTravelMs ?? raw.orbTeleportCameraTravelMs, 0, 8000, 500)),
      fadeInMs: Math.round(clampRange(raw.fadeInMs ?? raw.orbTeleportFadeInMs, 40, 4000, 280)),
      onTeleport: typeof raw.onTeleport === "function" ? raw.onTeleport : null,
      onComplete: typeof raw.onComplete === "function" ? raw.onComplete : null,
    });
  }

  function setOpacity(alpha = 1) {
    if (orbRuntime && typeof orbRuntime.setOpacity === "function") {
      orbRuntime.setOpacity(alpha);
      if (typeof onNeedsFrame === "function") onNeedsFrame();
    }
  }

  function clearTeleport() {
    teleportPlayToken += 1;
    if (teleportRaf) cancelAnimationFrame(teleportRaf);
    teleportRaf = 0;
    setOpacity(1);
  }

  function playTeleport(payload = {}) {
    if (!orbRuntime || typeof orbRuntime.setOpacity !== "function") {
      return { handled: false, skipped: "orb_teleport3d_runtime_missing" };
    }
    clearTeleport();
    const token = teleportPlayToken;
    const config = normalizeTeleportConfig({
      ...(payload && payload.config && typeof payload.config === "object" ? payload.config : {}),
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const startedAtMs = performance.now();
    let teleported = false;
    let travelDoneAtMs = startedAtMs + config.fadeOutMs + config.cameraTravelMs;
    let completed = false;
    function tick(nowMs) {
      if (token !== teleportPlayToken) return;
      const elapsedMs = Math.max(0, Number(nowMs) - startedAtMs);
      if (elapsedMs <= config.fadeOutMs) {
        const progress = Math.max(0, Math.min(1, elapsedMs / Math.max(1, config.fadeOutMs)));
        const flicker = buildFlickerMask(elapsedMs, config.flickerOnMs, config.flickerOffMs);
        setOpacity((1 - progress) * flicker);
        teleportRaf = requestAnimationFrame(tick);
        return;
      } else {
        if (!teleported) {
          teleported = true;
          if (config.onTeleport) {
            try {
              const maybePromise = config.onTeleport();
              if (maybePromise && typeof maybePromise.then === "function") {
                travelDoneAtMs = Infinity;
                maybePromise.finally(() => {
                  if (token !== teleportPlayToken) return;
                  travelDoneAtMs = performance.now();
                });
              }
            } catch (_) {}
          }
        }
      }
      if (nowMs < travelDoneAtMs) {
        setOpacity(0);
      } else {
        const fadeInElapsedMs = Math.max(0, Number(nowMs) - travelDoneAtMs);
        const progress = Math.max(0, Math.min(1, fadeInElapsedMs / Math.max(1, config.fadeInMs)));
        const flicker = buildFlickerMask(fadeInElapsedMs, config.flickerOnMs, config.flickerOffMs);
        setOpacity(progress * flicker);
      }
      if (nowMs >= travelDoneAtMs + config.fadeInMs) {
        teleportRaf = 0;
        setOpacity(1);
        if (!completed && config.onComplete) {
          completed = true;
          try {
            config.onComplete();
          } catch (_) {}
        }
        return;
      }
      teleportRaf = requestAnimationFrame(tick);
    }
    teleportRaf = requestAnimationFrame(tick);
    return { handled: true };
  }

  function playNod(payload = {}) {
    if (!nodRuntime || typeof nodRuntime.play !== "function") {
      return { handled: false, skipped: "orb_nod3d_runtime_missing" };
    }
    const result = nodRuntime.play(payload);
    if (result && result.handled && typeof onNeedsFrame === "function") onNeedsFrame();
    return result || { handled: false };
  }

  function applySpinColor(color = {}) {
    if (orbRuntime && typeof orbRuntime.applySpinColor === "function") {
      orbRuntime.applySpinColor(color);
      if (typeof onNeedsFrame === "function") onNeedsFrame();
    }
  }

  function clearSpinColor() {
    if (orbRuntime && typeof orbRuntime.clearSpinColor === "function") {
      orbRuntime.clearSpinColor();
      if (typeof onNeedsFrame === "function") onNeedsFrame();
    }
  }

  return Object.freeze({
    setWorldPosition,
    playNod,
    playTeleport,
    applySpinColor,
    clearSpinColor,
    update,
    getBo,
    getModel,
    getPosition() {
      return position;
    },
    getDepthPx() {
      return depth;
    },
    isNodActive() {
      return !!(nodRuntime && typeof nodRuntime.isActive === "function" && nodRuntime.isActive());
    },
    isSpinColorActive() {
      return !!(orbRuntime && typeof orbRuntime.isSpinColorActive === "function" && orbRuntime.isSpinColorActive());
    },
    isTeleportActive() {
      return !!teleportRaf;
    },
    hasModel() {
      return !!getModel();
    },
    dispose: disposeModel,
  });
}
