import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  ORB_BLOOM_CONFIG,
  STAGE_BLOOM_CONFIG,
} from "../../../game-runtime/rendering/three/three-bloom-config.js?v=20260505f";
import {
  createDepth3dBloomTrace,
  publishDepth3dBloomTrace,
  readDepth3dBloomConfigNumberParam,
  readDepth3dBloomNumberParam,
  updateDepth3dBloomTraceScene,
} from "./game-stage-depth3d-debug.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function resolveStageBloomConfig(config = STAGE_BLOOM_CONFIG) {
  const source = config && typeof config === "object" ? config : STAGE_BLOOM_CONFIG;
  const pixelRatio = readDepth3dBloomNumberParam(
    "depth3dBloomPixelRatio",
    readDepth3dBloomConfigNumberParam("depth3dBloomPixelRatio", source.pixelRatio, STAGE_BLOOM_CONFIG.pixelRatio || 1)
  );
  return Object.freeze({
    enabled: source.enabled !== false,
    strength: readDepth3dBloomConfigNumberParam("depth3dBloomStrength", source.strength, ORB_BLOOM_CONFIG.strength),
    radius: readDepth3dBloomConfigNumberParam("depth3dBloomRadius", source.radius, ORB_BLOOM_CONFIG.radius),
    threshold: readDepth3dBloomConfigNumberParam("depth3dBloomThreshold", source.threshold, ORB_BLOOM_CONFIG.threshold),
    pixelRatio: clampNumber(pixelRatio, 0.25, 1, 1),
  });
}

export function createGameStageDepth3dBloom({
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

  const trace = createDepth3dBloomTrace({ renderer, scene, camera, config: resolvedConfig });
  publishDepth3dBloomTrace(trace);
  updateDepth3dBloomTraceScene(trace, scene, camera);
  let nextSceneTraceAtMs = 0;

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
      nextSceneTraceAtMs = 0;
    },
    render() {
      trace.renderCalls += 1;
      const nowMs = performance.now();
      trace.lastRenderAtMs = Math.round(nowMs);
      if (nowMs >= nextSceneTraceAtMs) {
        updateDepth3dBloomTraceScene(trace, scene, camera);
        nextSceneTraceAtMs = nowMs + 250;
      }
      composer.render();
    },
    dispose() {
      trace.disposedAtMs = Math.round(performance.now());
      composer.dispose();
    },
  });
}
