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
} = {}) {
  const resolvedBo = Math.max(1, Number(bo) || 72);
  const material = createGlobeMaterial(materialConfig);
  const { model } = createGlobe3dModel({
    bo: resolvedBo,
    material,
    shellSegments,
  });
  model.name = name;
  const light = createGlobePointLight({
    bo: resolvedBo,
    config: materialConfig,
  });
  light.name = `${name}:light`;
  model.add(light);
  applyMeshFlags(model, { receiveShadow, castShadow });
  return model;
}

