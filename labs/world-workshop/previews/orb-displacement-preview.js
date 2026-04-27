import * as THREE from "three";
import { createOrbModel } from "../generators/orb-generator.js?v=20260427a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../effects/bloom/bloom-config.js?v=20260426a";
import { ORB_SURFACE_DISPLACEMENT_CONFIG } from "../effects/orb-surface-displacement/orb-surface-displacement-config.js?v=20260427e";
import { ORB_MATERIAL_CONFIG } from "../materials/orb/opalescent-orb-config.js?v=20260426a";
import { createOpalescentOrbShellMaterial, createOrbPointLight, updateOrbPointLight } from "../materials/orb/opalescent-orb-material.js?v=20260427e";

export function renderOrbDisplacementPreview({
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
    cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
    minDistanceBo: 0.85,
    maxDistanceBo: 28,
    bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) material.uniforms.uTime.value = time;
      });
      if (orbLight) updateOrbPointLight(orbLight, time, ORB_MATERIAL_CONFIG);
    },
  });
  if (!inspector) return null;

  const shellMaterial = createOpalescentOrbShellMaterial(ORB_MATERIAL_CONFIG, {
    bo,
    surfaceDisplacement: ORB_SURFACE_DISPLACEMENT_CONFIG,
  });
  animatedMaterials.push(shellMaterial);

  const { model, metrics } = createOrbModel({
    bo,
    shellMaterial,
    edgeMaterials: inspector.edgeMaterials,
    includeCore: false,
    includeRibs: false,
    shellSegments: 96,
    ringSegments: 192,
  });

  orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
  updateOrbPointLight(orbLight, 0, ORB_MATERIAL_CONFIG);
  model.add(orbLight);

  inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.04));
  inspector.scene.add(model);
  inspector.render();
  return Object.freeze({
    ...metrics,
    displacementWaveCount: ORB_SURFACE_DISPLACEMENT_CONFIG.waveCount,
    displacementWaveDepth: bo * ORB_SURFACE_DISPLACEMENT_CONFIG.waveDepthBO,
    displacementSpeedHz: ORB_SURFACE_DISPLACEMENT_CONFIG.oscillationSpeedHz,
    displacementCellMix: ORB_SURFACE_DISPLACEMENT_CONFIG.cellMix,
  });
}
