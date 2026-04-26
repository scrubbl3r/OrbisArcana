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
    canvasClassName: "worldObjectInspectorCanvas ionicPlinthCanvas",
  });
  if (!inspector) return null;

  const faceMaterial = createWorldFaceMaterial();
  const { model, metrics } = createOrbSpawnPlinthModel({
    bo,
    material: faceMaterial,
    decorateMesh: (mesh) => {
      addLineEdges(mesh, {
        linewidth: 2,
        edgeMaterials: inspector.edgeMaterials,
      });
    },
  });

  addOrbScaleGuide(model, {
    bo,
    y: metrics.plinthHeight + bo * 0.5,
  });

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}

