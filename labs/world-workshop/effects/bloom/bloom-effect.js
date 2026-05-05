import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function createBloomComposer({
  renderer,
  scene,
  camera,
  bloom,
} = {}) {
  if (!renderer || !scene || !camera || !bloom) {
    return Object.freeze({
      composer: null,
      bloomPass: null,
    });
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    Number(bloom.strength) || 1.5,
    Number(bloom.radius) || 0.4,
    Number(bloom.threshold) || 0
  );
  composer.addPass(bloomPass);

  const trace = {
    createdAtMs: Math.round(performance.now()),
    renderPath: "lab-world-object-inspector",
    config: Object.freeze({
      strength: Number(bloom.strength) || 1.5,
      radius: Number(bloom.radius) || 0.4,
      threshold: Number(bloom.threshold) || 0,
    }),
    composerCreated: true,
    bloomPassCreated: true,
  };
  globalThis.__orbisLabBloomTrace = trace;

  return Object.freeze({
    composer,
    bloomPass,
    trace,
  });
}
