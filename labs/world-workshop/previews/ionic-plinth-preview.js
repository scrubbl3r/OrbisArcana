import { PLINTH_MATERIAL_CONFIG } from "../configs/plinth-material-config.js?v=20260426a";
import { createOrbSpawnPlinthModel } from "../generators/orb-spawn-plinth-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import {
  addLineEdges,
  addOrbScaleGuide,
  createWorldFaceMaterial,
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

  const faceMaterial = createWorldFaceMaterial({
    color: PLINTH_MATERIAL_CONFIG.faceColor,
  });
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

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}
