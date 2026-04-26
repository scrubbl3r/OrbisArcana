import { ORB_MATERIAL_CONFIG } from "../configs/orb-material-config.js?v=20260426a";
import { createOrbModel } from "../generators/orb-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { createOpalescentOrbGlowMaterial, createOpalescentOrbShellMaterial, createOrbPointLight, updateOrbPointLight } from "../rendering/orb-materials.js?v=20260426a";

export function renderOrbPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const startedAt = performance.now();
  const animatedMaterials = [];
  let orbLight = null;
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
    minDistanceBo: 0.9,
    maxDistanceBo: 28,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) {
          material.uniforms.uTime.value = time;
        }
      });
      if (orbLight) updateOrbPointLight(orbLight, time, ORB_MATERIAL_CONFIG);
    },
  });
  if (!inspector) return null;

  orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
  const shellMaterial = createOpalescentOrbShellMaterial(ORB_MATERIAL_CONFIG);
  const glowMaterial = ORB_MATERIAL_CONFIG.glowEnabled
    ? createOpalescentOrbGlowMaterial(ORB_MATERIAL_CONFIG)
    : null;
  animatedMaterials.push(shellMaterial);
  if (glowMaterial) animatedMaterials.push(glowMaterial);

  const { model, metrics } = createOrbModel({
    bo,
    shellMaterial,
    glowMaterial,
    glowScale: ORB_MATERIAL_CONFIG.glowScale,
    edgeMaterials: inspector.edgeMaterials,
    includeCore: false,
    includeRibs: false,
  });

  updateOrbPointLight(orbLight, 0, ORB_MATERIAL_CONFIG);
  model.add(orbLight);

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}
