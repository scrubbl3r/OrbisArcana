import * as THREE from "three";
import { createPlinthModel } from "../generators/plinth-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { GRAPHITE_CONFIG } from "../materials/graphite/graphite-config.js?v=20260426a";
import { createGraphiteMaterial } from "../materials/graphite/graphite-material.js?v=20260426a";
import {
  addLineEdges,
  addOrbScaleGuide,
} from "../rendering/world-render-utils.js?v=20260426a";

export function renderPlinthPreview({
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

  const faceMaterial = createGraphiteMaterial(GRAPHITE_CONFIG);
  const { model, metrics } = createPlinthModel({
    bo,
    material: faceMaterial,
    decorateMesh: (mesh) => {
      addLineEdges(mesh, {
        color: GRAPHITE_CONFIG.edgeColor,
        linewidth: GRAPHITE_CONFIG.edgeWidth,
        opacity: GRAPHITE_CONFIG.edgeOpacity,
        thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
        edgeMaterials: inspector.edgeMaterials,
      });
    },
  });

  addOrbScaleGuide(model, {
    bo,
    y: metrics.plinthHeight + bo * 0.5,
    color: GRAPHITE_CONFIG.guideColor,
  });

  inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  inspector.scene.add(new THREE.HemisphereLight(0xcfefff, 0x050507, 0.45));
  inspector.scene.add(model);
  inspector.render();
  return metrics;
}

export const renderIonicPlinthPreview = renderPlinthPreview;
