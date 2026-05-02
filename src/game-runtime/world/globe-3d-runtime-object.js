import { createGlobe3dModel } from "./globe-3d-model.js";
import { createGlobeMaterial } from "./globe-3d-material.js";
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
  applyMeshFlags(model, { receiveShadow, castShadow });
  return model;
}
