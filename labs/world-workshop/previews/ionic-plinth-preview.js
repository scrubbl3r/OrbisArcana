import * as THREE from "three";
import { createOrbSpawnPlinthModel } from "../generators/orb-spawn-plinth-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { PLINTH_MATERIAL_CONFIG } from "../materials/plinth/graphite-plinth-config.js?v=20260426a";
import { createGraphitePlinthMaterial } from "../materials/plinth/graphite-plinth-material.js?v=20260426a";
import {
  addLineEdges,
  addOrbScaleGuide,
} from "../rendering/world-render-utils.js?v=20260426a";

export function renderIonicPlinthPreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const inspector = createWorldObjectInspector({
    root,
    bo,
  });
  if (!inspector) return null;

  const faceMaterial = createGraphitePlinthMaterial(PLINTH_MATERIAL_CONFIG);
  const { model, metrics } = createOrbSpawnPlinthModel({
    bo,
    material: faceMaterial,
    decorateMesh: (mesh) => {
      addLineEdges(mesh, {
        color: PLINTH_MATERIAL_CONFIG.edgeColor,
        linewidth: PLINTH_MATERIAL_CONFIG.edgeWidth,
        thresholdAngle: PLINTH_MATERIAL_CONFIG.edgeThresholdAngle,
        edgeMaterials: inspector.edgeMaterials,
      });
    },
  });

  addOrbScaleGuide(model, {
    bo,
    y: metrics.plinthHeight + bo * 0.5,
    color: PLINTH_MATERIAL_CONFIG.guideColor,
  });

  inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  inspector.scene.add(new THREE.HemisphereLight(0xcfefff, 0x050507, 0.45));
  inspector.scene.add(model);
  inspector.render();
  return metrics;
}
