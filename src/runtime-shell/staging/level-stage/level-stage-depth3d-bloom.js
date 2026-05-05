import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  ORB_BLOOM_CONFIG,
  STAGE_BLOOM_CONFIG,
} from "../../../game-runtime/rendering/three/three-bloom-config.js?v=20260505e";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
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

function readConfigNumberParam(name, value, fallback) {
  const resolvedFallback = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return readNumberParam(name, resolvedFallback);
}

function resolveStageBloomConfig(config = STAGE_BLOOM_CONFIG) {
  const source = config && typeof config === "object" ? config : STAGE_BLOOM_CONFIG;
  const pixelRatio = readNumberParam(
    "depth3dBloomPixelRatio",
    readConfigNumberParam("depth3dBloomPixelRatio", source.pixelRatio, STAGE_BLOOM_CONFIG.pixelRatio || 1)
  );
  return Object.freeze({
    enabled: source.enabled !== false,
    strength: readConfigNumberParam("depth3dBloomStrength", source.strength, ORB_BLOOM_CONFIG.strength),
    radius: readConfigNumberParam("depth3dBloomRadius", source.radius, ORB_BLOOM_CONFIG.radius),
    threshold: readConfigNumberParam("depth3dBloomThreshold", source.threshold, ORB_BLOOM_CONFIG.threshold),
    pixelRatio: clampNumber(pixelRatio, 0.25, 1, 1),
  });
}

function createTraceState({
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

function updateTraceScene(trace, scene = null, camera = null) {
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
      if (names.length >= 24) return;
      const name = String(child && child.name || "").trim();
      if (name) names.push(name);
    });
  }
  trace.sceneObjectNames = names;
}

export function createLevelStageDepth3dBloom({
  renderer = null,
  scene = null,
  camera = null,
  config = ORB_BLOOM_CONFIG,
} = {}) {
  const resolvedConfig = resolveStageBloomConfig(config);
  if (!renderer || !scene || !camera || !resolvedConfig || resolvedConfig.enabled === false) {
    return null;
  }

  const composer = new EffectComposer(renderer);
  if (typeof composer.setPixelRatio === "function") {
    composer.setPixelRatio(resolvedConfig.pixelRatio);
  }
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    resolvedConfig.strength,
    resolvedConfig.radius,
    resolvedConfig.threshold
  );
  composer.addPass(bloomPass);

  const trace = createTraceState({ renderer, scene, camera, config: resolvedConfig });
  globalThis.__orbisDepth3dBloomTrace = trace;
  updateTraceScene(trace, scene, camera);

  return Object.freeze({
    bloomPass,
    getTrace() {
      return trace;
    },
    setSize(width = 1, height = 1) {
      const resolvedWidth = Math.max(1, Math.round(width));
      const resolvedHeight = Math.max(1, Math.round(height));
      if (typeof composer.setPixelRatio === "function") {
        composer.setPixelRatio(resolvedConfig.pixelRatio);
      }
      composer.setSize(resolvedWidth, resolvedHeight);
      trace.resizeCalls += 1;
      trace.lastSize = Object.freeze({
        width: resolvedWidth,
        height: resolvedHeight,
        pixelRatio: resolvedConfig.pixelRatio,
        renderWidth: Math.max(1, Math.round(resolvedWidth * resolvedConfig.pixelRatio)),
        renderHeight: Math.max(1, Math.round(resolvedHeight * resolvedConfig.pixelRatio)),
      });
    },
    render() {
      trace.renderCalls += 1;
      trace.lastRenderAtMs = Math.round(performance.now());
      updateTraceScene(trace, scene, camera);
      composer.render();
    },
    dispose() {
      trace.disposedAtMs = Math.round(performance.now());
      composer.dispose();
    },
  });
}
