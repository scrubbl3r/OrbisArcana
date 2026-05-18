import * as THREE from "three";
import { ORB_IDLE_CONFIG } from "../behaviors/orb/orb-idle-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import { createPlinthModel } from "../generators/plinth-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../effects/bloom/bloom-config.js?v=20260426a";
import { ORB_3D_VISUAL_DEFAULTS as ORB_MATERIAL_CONFIG } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260517a";
import { createOpalescentOrbShellMaterial, createOrbPointLight, updateOrbPointLight } from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260517b";
import { GRAPHITE_CONFIG } from "../materials/graphite/graphite-config.js?v=20260426a";
import { createGraphiteMaterial } from "../materials/graphite/graphite-material.js?v=20260426a";
import { addLineEdges } from "../../../src/game-runtime/rendering/three/three-line-utils.js?v=20260428a";

export function renderOrbSpawnAssemblyPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const startedAt = performance.now();
  const animatedMaterials = [];
  const animatedLights = [];
  const animatedNodes = [];
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 1.26, y: 0.42, z: 4.25 }),
    minDistanceBo: 1.1,
    maxDistanceBo: 32,
    enableShadows: true,
    bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) material.uniforms.uTime.value = time;
      });
      animatedLights.forEach((light) => updateOrbPointLight(light, time, ORB_MATERIAL_CONFIG));
      animatedNodes.forEach(({ node, baseY, idle }) => {
        const bobY =
          Math.sin(time * idle.bobYRate) * bo * idle.bobYAmplitudeBO +
          Math.sin(time * idle.bobYSecondaryRate) * bo * idle.bobYSecondaryAmplitudeBO;
        const driftX =
          Math.sin(time * idle.driftXRate) * bo * idle.driftXAmplitudeBO +
          Math.sin(time * idle.driftSecondaryRate) * bo * idle.driftSecondaryAmplitudeBO;
        const driftZ =
          Math.sin(time * idle.driftZRate + idle.driftZPhase) * bo * idle.driftZAmplitudeBO +
          Math.cos(time * idle.driftSecondaryRate * 0.87) * bo * idle.driftSecondaryAmplitudeBO;
        node.position.set(
          driftX,
          baseY + bobY,
          driftZ
        );
      });
    },
  });
  if (!inspector) return null;

  const plinthBo = bo * GRAPHITE_CONFIG.assemblyScale;
  const plinthMaterial = createGraphiteMaterial(GRAPHITE_CONFIG);
  const { model: plinthModel, metrics: plinthMetrics } = createPlinthModel({
    bo: plinthBo,
    material: plinthMaterial,
    decorateMesh: (mesh) => {
      addLineEdges(mesh, {
        color: GRAPHITE_CONFIG.edgeHaloColor,
        linewidth: GRAPHITE_CONFIG.edgeHaloWidth,
        opacity: GRAPHITE_CONFIG.edgeHaloOpacity,
        thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
        edgeMaterials: inspector.edgeMaterials,
      });
      addLineEdges(mesh, {
        color: GRAPHITE_CONFIG.edgeColor,
        linewidth: GRAPHITE_CONFIG.edgeWidth,
        opacity: GRAPHITE_CONFIG.edgeOpacity,
        thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
        edgeMaterials: inspector.edgeMaterials,
      });
    },
  });
  plinthModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  inspector.scene.add(plinthModel);

  const groundPlaneSize = bo * (Number(GRAPHITE_CONFIG.assemblyGroundPlaneSizeBO) || 4.8);
  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(groundPlaneSize, groundPlaneSize),
    createGraphiteMaterial(GRAPHITE_CONFIG)
  );
  groundPlane.rotation.x = -Math.PI * 0.5;
  groundPlane.position.y = -plinthMetrics.columnCenterY - bo * 0.015;
  groundPlane.receiveShadow = true;
  inspector.scene.add(groundPlane);

  const shellMaterial = createOpalescentOrbShellMaterial(ORB_MATERIAL_CONFIG);
  animatedMaterials.push(shellMaterial);
  const { model: orbModel, metrics: orbMetrics } = createOrbModel({
    bo,
    shellMaterial,
    edgeMaterials: inspector.edgeMaterials,
    includeCore: false,
    includeRibs: false,
  });

  const orbClearance = bo * 0.4;
  const orbBaseY = plinthMetrics.plinthHeight + orbMetrics.radius + orbClearance - plinthMetrics.columnCenterY;
  orbModel.position.set(0, orbBaseY, 0);
  const orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
  updateOrbPointLight(orbLight, 0, ORB_MATERIAL_CONFIG);
  orbModel.add(orbLight);
  animatedLights.push(orbLight);
  inspector.scene.add(orbModel);
  animatedNodes.push({ node: orbModel, baseY: orbBaseY, idle: ORB_IDLE_CONFIG });

  const ambient = new THREE.AmbientLight(0xffffff, 0.018);
  inspector.scene.add(ambient);
  const fill = new THREE.HemisphereLight(0xbfdfff, 0x050507, 0.055);
  inspector.scene.add(fill);

  inspector.render();
  return Object.freeze({
    ...plinthMetrics,
    orbDiameter: orbMetrics.diameter,
    orbRadius: orbMetrics.radius,
    orbClearance,
    groundPlaneSize,
    assemblyScale: GRAPHITE_CONFIG.assemblyScale,
  });
}
