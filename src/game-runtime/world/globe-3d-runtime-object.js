import * as THREE from "three";
import { createGlobe3dModel } from "./globe-3d-model.js";
import { createGlobeMaterial, createGlobePointLight } from "./globe-3d-material.js";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "./world-globe-3d-default.js";

function applyMeshFlags(object = null, {
  receiveShadow = false,
  castShadow = false,
} = {}) {
  if (!object || typeof object.traverse !== "function") return;
  object.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.receiveShadow = !!receiveShadow;
    node.castShadow = !!castShadow;
  });
}

export function createRuntimeGlobe3dObject({
  bo = 72,
  materialConfig = WORLD_GLOBE_3D_VISUAL_DEFAULTS.material,
  name = "globe3d:runtime",
  shellSegments = 32,
  receiveShadow = false,
  castShadow = false,
  depthTest = true,
  renderOrder = 0,
  includeVisibilityCore = false,
} = {}) {
  const resolvedBo = Math.max(1, Number(bo) || 72);
  const material = createGlobeMaterial(materialConfig);
  material.depthTest = depthTest !== false;
  const { model } = createGlobe3dModel({
    bo: resolvedBo,
    material,
    shellSegments,
  });
  model.name = name;
  model.renderOrder = Number(renderOrder) || 0;
  model.traverse((node) => {
    if (node && node.isObject3D) node.renderOrder = model.renderOrder;
  });
  if (includeVisibilityCore) {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(resolvedBo * 0.11, 18, 10),
      new THREE.MeshBasicMaterial({
        color: materialConfig.lightColor || materialConfig.shellCyanColor || 0xdff6ff,
        transparent: true,
        opacity: 0.74,
        depthWrite: false,
        depthTest: depthTest !== false,
        blending: THREE.AdditiveBlending,
      })
    );
    core.name = `${name}:visibility_core`;
    core.renderOrder = model.renderOrder + 1;
    model.add(core);
  }
  const light = createGlobePointLight({
    bo: resolvedBo,
    config: materialConfig,
  });
  light.name = `${name}:light`;
  model.add(light);
  applyMeshFlags(model, { receiveShadow, castShadow });
  return model;
}
