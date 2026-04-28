import { createOrb3dModel } from "./orb-3d-model.js";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  createOrbShadowSpotLight,
  updateOrbPointLight,
} from "./orb-3d-material.js";
import { ORB_3D_VISUAL_DEFAULTS } from "./orb-3d-default.js";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";

export function createOrb3dRuntime({
  bo = 72,
  config = ORB_3D_VISUAL_DEFAULTS,
  edgeMaterials = [],
  includeCore = false,
  includeRibs = false,
  surfaceDisplacement = null,
} = {}) {
  const shellMaterial = createOpalescentOrbShellMaterial(config, {
    bo,
    surfaceDisplacement,
  });
  const { model, metrics } = createOrb3dModel({
    bo,
    shellMaterial,
    edgeMaterials,
    includeCore,
    includeRibs,
  });
  const pointLight = createOrbPointLight({ bo, config });
  updateOrbPointLight(pointLight, 0, config);
  model.add(pointLight);

  const shadowSpot = createOrbShadowSpotLight({ bo, config });
  let disposed = false;

  function setTime(time = 0) {
    if (disposed) return;
    if (shellMaterial.uniforms && shellMaterial.uniforms.uTime) {
      shellMaterial.uniforms.uTime.value = Number(time) || 0;
    }
    updateOrbPointLight(pointLight, Number(time) || 0, config);
  }

  function setPosition({ x = 0, y = 0, z = 0 } = {}) {
    if (disposed) return;
    model.position.set(Number(x) || 0, Number(y) || 0, Number(z) || 0);
    if (shadowSpot) shadowSpot.position.copy(model.position);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (model.parent) model.parent.remove(model);
    if (shadowSpot && shadowSpot.parent) shadowSpot.parent.remove(shadowSpot);
    disposeThreeObject(model);
    if (shadowSpot) disposeThreeObject(shadowSpot);
  }

  return Object.freeze({
    model,
    metrics,
    shellMaterial,
    pointLight,
    shadowSpot,
    setTime,
    setPosition,
    dispose,
  });
}
