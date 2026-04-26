import * as THREE from "three";
import { ORB_MATERIAL_CONFIG } from "../configs/orb-material-config.js?v=20260426a";
import { PLINTH_MATERIAL_CONFIG } from "../configs/plinth-material-config.js?v=20260426a";
import { createOrbModel } from "../generators/orb-generator.js?v=20260426a";
import { createOrbSpawnPlinthModel } from "../generators/orb-spawn-plinth-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { createOpalescentOrbShellMaterial, createOrbPointLight } from "../rendering/orb-materials.js?v=20260426a";
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
  const animatedNodes = [];
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 1.26, y: 0.42, z: 4.25 }),
    minDistanceBo: 1.1,
    maxDistanceBo: 32,
    onFrame: () => {
      const time = (performance.now() - startedAt) / 1000;
      animatedMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) material.uniforms.uTime.value = time;
      });
      animatedNodes.forEach(({ node, baseY }) => {
        node.position.set(
          0,
          baseY + Math.sin(time * 1.04) * bo * 0.045,
          0
        );
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
  inspector.scene.add(plinthModel);

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
  orbModel.add(createOrbPointLight({ bo, config: ORB_MATERIAL_CONFIG }));
  inspector.scene.add(orbModel);
  animatedNodes.push({ node: orbModel, baseY: orbBaseY });

  const ambient = new THREE.AmbientLight(0xffffff, 0.035);
  inspector.scene.add(ambient);
  const fill = new THREE.HemisphereLight(0xbfdfff, 0x050507, 0.16);
  inspector.scene.add(fill);

  inspector.render();
  return Object.freeze({
    ...plinthMetrics,
    orbDiameter: orbMetrics.diameter,
    orbRadius: orbMetrics.radius,
    orbClearance,
    assemblyScale: PLINTH_MATERIAL_CONFIG.assemblyScale,
  });
}
