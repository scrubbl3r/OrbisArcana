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

  return Object.freeze({
    composer,
    bloomPass,
  });
}

