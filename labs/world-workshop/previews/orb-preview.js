import { createOrbModel } from "../generators/orb-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../effects/bloom/bloom-config.js?v=20260426a";
import { ORB_MATERIAL_CONFIG } from "../materials/orb/opalescent-orb-config.js?v=20260428a";
import { createOpalescentOrbShellMaterial, createOrbPointLight, updateOrbPointLight } from "../materials/orb/opalescent-orb-material.js?v=20260428a";

export function renderOrbPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const startedAt = performance.now();
  const animatedMaterials = [];
  const animatedLights = [];
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
    minDistanceBo: 0.9,
    maxDistanceBo: 28,
    enableShadows: true,
    bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) {
          material.uniforms.uTime.value = time;
        }
      });
      animatedLights.forEach((light) => updateOrbPointLight(light, time, ORB_MATERIAL_CONFIG));
    },
  });
  if (!inspector) return null;

  const orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
  const shellMaterial = createOpalescentOrbShellMaterial(ORB_MATERIAL_CONFIG);
  animatedMaterials.push(shellMaterial);

  const { model, metrics } = createOrbModel({
    bo,
    shellMaterial,
    edgeMaterials: inspector.edgeMaterials,
    includeCore: false,
    includeRibs: false,
  });

  updateOrbPointLight(orbLight, 0, ORB_MATERIAL_CONFIG);
  model.add(orbLight);
  animatedLights.push(orbLight);

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}
