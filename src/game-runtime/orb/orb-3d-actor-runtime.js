import { createOrb3dRuntime } from "./orb-3d-runtime.js?v=20260527-tesla-light-a";
import {
  createOrbNod3dRuntime,
  createOrbNod3dSurfaceDisplacementConfig,
} from "./orb-nod-3d-runtime.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
  let basePosition = position;
  let lastTimeSec = 0;
  let currentShaderState = null;
  const floatHoldVisual = {
    active: false,
    startedAtSec: 0,
    phase: 0,
  };

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
    if (currentShaderState && typeof orbRuntime.setShaderState === "function") {
      orbRuntime.setShaderState(currentShaderState);
    }
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
    basePosition = position;
    applyActorPosition(lastTimeSec);
    publishTelemetry();
    if (typeof onNeedsFrame === "function") onNeedsFrame();
    return true;
  }

  function resolveFloatHoldOffset(timeSec = lastTimeSec) {
    if (!floatHoldVisual.active) return { x: 0, y: 0, z: 0 };
    const t = Math.max(0, (Number(timeSec) || 0) - floatHoldVisual.startedAtSec);
    const resolvedBo = getBo();
    return {
      x: Math.sin((t * Math.PI * 2 * 0.08) + floatHoldVisual.phase) * resolvedBo * 0.02,
      y: Math.sin((t * Math.PI * 2 * 0.72) + (floatHoldVisual.phase * 0.61)) * resolvedBo * 0.04,
      z: 0,
    };
  }

  function applyActorPosition(timeSec = lastTimeSec) {
    if (!orbRuntime || typeof orbRuntime.setPosition !== "function") return;
    const offset = resolveFloatHoldOffset(timeSec);
    orbRuntime.setPosition({
      x: Number(basePosition.x) + offset.x,
      y: Number(basePosition.y) + offset.y,
      z: Number(basePosition.z) + offset.z,
    });
  }

  function update(timeSec = 0) {
    lastTimeSec = Number(timeSec) || 0;
    if (orbRuntime && typeof orbRuntime.setTime === "function") {
      orbRuntime.setTime(lastTimeSec);
    }
    if (nodRuntime && typeof nodRuntime.update === "function") {
      nodRuntime.update(lastTimeSec);
    }
    applyActorPosition(lastTimeSec);
  }

  function setOpacity(alpha = 1) {
    if (orbRuntime && typeof orbRuntime.setOpacity === "function") {
      orbRuntime.setOpacity(alpha);
      if (typeof onNeedsFrame === "function") onNeedsFrame();
    }
  }

  function setLifecycleErosion(lifecycleErosion = null) {
    if (orbRuntime && typeof orbRuntime.setLifecycleErosion === "function") {
      orbRuntime.setLifecycleErosion(lifecycleErosion);
      if (currentShaderState && typeof orbRuntime.setShaderState === "function") {
        orbRuntime.setShaderState(currentShaderState);
      }
      if (typeof onNeedsFrame === "function") onNeedsFrame();
    }
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

  function setShaderState(shaderState = {}) {
    currentShaderState = shaderState && typeof shaderState === "object"
      ? { ...(currentShaderState || {}), ...shaderState }
      : currentShaderState;
    if (orbRuntime && typeof orbRuntime.setShaderState === "function") {
      orbRuntime.setShaderState(currentShaderState || {});
      if (typeof onNeedsFrame === "function") onNeedsFrame();
    }
  }

  function getShaderTrace() {
    return {
      hasModel: !!getModel(),
      bo: getBo(),
      zBO,
      depthPx: depth,
      position,
      cachedShaderState: currentShaderState ? { ...currentShaderState } : null,
      runtime: orbRuntime && typeof orbRuntime.getShaderTrace === "function"
        ? orbRuntime.getShaderTrace()
        : null,
    };
  }

  function setFloatHoldVisual({ active = false, atMs = null, phase = null } = {}) {
    const nextActive = !!active;
    if (floatHoldVisual.active === nextActive) return { handled: true, active: nextActive };
    floatHoldVisual.active = nextActive;
    floatHoldVisual.startedAtSec = Number.isFinite(Number(atMs))
      ? Number(atMs) / 1000
      : lastTimeSec;
    floatHoldVisual.phase = Number.isFinite(Number(phase))
      ? Number(phase)
      : Math.random() * Math.PI * 2;
    applyActorPosition(lastTimeSec);
    if (typeof onNeedsFrame === "function") onNeedsFrame();
    return { handled: true, active: nextActive };
  }

  return Object.freeze({
    setWorldPosition,
    playNod,
    setOpacity,
    setLifecycleErosion,
    applySpinColor,
    clearSpinColor,
    setShaderState,
    getShaderTrace,
    setFloatHoldVisual,
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
    isFloatHoldVisualActive() {
      return !!floatHoldVisual.active;
    },
    hasModel() {
      return !!getModel();
    },
    dispose: disposeModel,
  });
}
