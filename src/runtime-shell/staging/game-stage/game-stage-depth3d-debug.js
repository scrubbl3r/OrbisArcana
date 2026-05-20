export const GAME_STAGE_DEPTH3D_TRACE_VERSION = "20260519-camera-plumb-teardrop-a";

export function publishDepth3dModuleVersion(version = GAME_STAGE_DEPTH3D_TRACE_VERSION) {
  globalThis.__orbisDepth3dModuleVersion = String(version || "");
}

function readSearchParam(name) {
  try {
    const params = new URLSearchParams(globalThis.location && globalThis.location.search || "");
    if (!params.has(name)) return null;
    const value = params.get(name);
    const normalized = String(value == null ? "" : value).trim();
    return normalized ? normalized : null;
  } catch (_) {
    return null;
  }
}

function readNumberParam(name, fallback) {
  const raw = readSearchParam(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function readDepth3dBloomNumberParam(name, fallback) {
  return readNumberParam(name, fallback);
}

export function readDepth3dBloomConfigNumberParam(name, value, fallback) {
  const resolvedFallback = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return readNumberParam(name, resolvedFallback);
}

export function createDepth3dBloomTrace({
  renderer = null,
  scene = null,
  camera = null,
  config = null,
} = {}) {
  return {
    createdAtMs: Math.round(performance.now()),
    enabled: true,
    renderCalls: 0,
    resizeCalls: 0,
    lastRenderAtMs: 0,
    lastSize: Object.freeze({
      width: 0,
      height: 0,
      pixelRatio: Number(config && config.pixelRatio) || 1,
      renderWidth: 0,
      renderHeight: 0,
    }),
    config,
    renderer: renderer ? {
      alpha: !!(renderer.getContext && renderer.getContext().getContextAttributes && renderer.getContext().getContextAttributes().alpha),
      pixelRatio: typeof renderer.getPixelRatio === "function" ? renderer.getPixelRatio() : null,
      bloomPixelRatio: Number(config && config.pixelRatio) || 1,
    } : null,
    camera: camera ? {
      fov: camera.fov,
      near: camera.near,
      far: camera.far,
    } : null,
    sceneChildren: scene && Array.isArray(scene.children) ? scene.children.length : 0,
    sceneObjectNames: [],
  };
}

export function updateDepth3dBloomTraceScene(trace, scene = null, camera = null) {
  if (!trace) return;
  trace.sceneChildren = scene && Array.isArray(scene.children) ? scene.children.length : 0;
  trace.camera = camera ? {
    fov: camera.fov,
    near: camera.near,
    far: camera.far,
    aspect: camera.aspect,
    position: {
      x: Math.round((Number(camera.position && camera.position.x) || 0) * 1000) / 1000,
      y: Math.round((Number(camera.position && camera.position.y) || 0) * 1000) / 1000,
      z: Math.round((Number(camera.position && camera.position.z) || 0) * 1000) / 1000,
    },
  } : null;
  const names = [];
  if (scene && typeof scene.traverse === "function") {
    scene.traverse((child) => {
      if (names.length >= 16) return;
      const name = String(child && child.name || "").trim();
      if (name) names.push(name);
    });
  }
  trace.sceneObjectNames = names;
}

export function publishDepth3dBloomTrace(trace = null) {
  globalThis.__orbisDepth3dBloomTrace = trace;
}
