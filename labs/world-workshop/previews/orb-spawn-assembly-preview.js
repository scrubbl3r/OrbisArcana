import * as THREE from "three";
import { ORB_MATERIAL_CONFIG } from "../configs/orb-material-config.js?v=20260426a";
import { PLINTH_MATERIAL_CONFIG } from "../configs/plinth-material-config.js?v=20260426a";
import { createOrbModel } from "../generators/orb-generator.js?v=20260426a";
import { createOrbSpawnPlinthModel } from "../generators/orb-spawn-plinth-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { createOpalescentOrbShellMaterial, createOrbPointLight, createOrbShadowSpotLight, updateOrbPointLight } from "../rendering/orb-materials.js?v=20260426a";
import { createLitBlackPlinthMaterial } from "../rendering/plinth-materials.js?v=20260426a";
import { addLineEdges } from "../rendering/world-render-utils.js?v=20260426a";

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
  const shadowRigs = [];
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 1.26, y: 0.42, z: 4.25 }),
    minDistanceBo: 1.1,
    maxDistanceBo: 32,
    enableShadows: true,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) material.uniforms.uTime.value = time;
      });
      animatedLights.forEach((light) => updateOrbPointLight(light, time, ORB_MATERIAL_CONFIG));
      animatedNodes.forEach(({ node, baseY }) => {
        node.position.set(
          0,
          baseY + Math.sin(time * 1.04) * bo * 0.045,
          0
        );
      });
      shadowRigs.forEach(({ light, target, source, targetY }) => {
        light.position.copy(source.position);
        target.position.set(0, targetY, 0);
      });
    },
  });
  if (!inspector) return null;

  const plinthBo = bo * PLINTH_MATERIAL_CONFIG.assemblyScale;
  const plinthMaterial = createLitBlackPlinthMaterial(PLINTH_MATERIAL_CONFIG);
  const { model: plinthModel, metrics: plinthMetrics } = createOrbSpawnPlinthModel({
    bo: plinthBo,
    material: plinthMaterial,
    decorateMesh: (mesh) => {
      addLineEdges(mesh, {
        color: PLINTH_MATERIAL_CONFIG.edgeHaloColor,
        linewidth: PLINTH_MATERIAL_CONFIG.edgeHaloWidth,
        opacity: PLINTH_MATERIAL_CONFIG.edgeHaloOpacity,
        thresholdAngle: PLINTH_MATERIAL_CONFIG.edgeThresholdAngle,
        edgeMaterials: inspector.edgeMaterials,
      });
      addLineEdges(mesh, {
        color: PLINTH_MATERIAL_CONFIG.edgeColor,
        linewidth: PLINTH_MATERIAL_CONFIG.edgeWidth,
        opacity: PLINTH_MATERIAL_CONFIG.edgeOpacity,
        thresholdAngle: PLINTH_MATERIAL_CONFIG.edgeThresholdAngle,
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

  const groundPlaneSize = bo * (Number(PLINTH_MATERIAL_CONFIG.assemblyGroundPlaneSizeBO) || 4.8);
  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(groundPlaneSize, groundPlaneSize),
    createLitBlackPlinthMaterial(PLINTH_MATERIAL_CONFIG)
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

  const orbClearance = bo * 0.15;
  const orbBaseY = plinthMetrics.plinthHeight + orbMetrics.radius + orbClearance - plinthMetrics.columnCenterY;
  orbModel.position.set(0, orbBaseY, 0);
  const orbLight = createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG });
  updateOrbPointLight(orbLight, 0, ORB_MATERIAL_CONFIG);
  orbModel.add(orbLight);
  animatedLights.push(orbLight);
  inspector.scene.add(orbModel);
  animatedNodes.push({ node: orbModel, baseY: orbBaseY });

  const shadowSpot = createOrbShadowSpotLight({ bo, config: ORB_MATERIAL_CONFIG });
  if (shadowSpot) {
    const shadowTarget = new THREE.Object3D();
    shadowSpot.position.copy(orbModel.position);
    shadowTarget.position.set(0, plinthMetrics.plinthHeight - plinthMetrics.columnCenterY, 0);
    shadowSpot.target = shadowTarget;
    inspector.scene.add(shadowSpot, shadowTarget);
    shadowRigs.push({
      light: shadowSpot,
      target: shadowTarget,
      source: orbModel,
      targetY: plinthMetrics.plinthHeight - plinthMetrics.columnCenterY,
    });
  }

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
    shadowSpot: Boolean(shadowSpot),
    groundPlaneSize,
    assemblyScale: PLINTH_MATERIAL_CONFIG.assemblyScale,
  });
}
