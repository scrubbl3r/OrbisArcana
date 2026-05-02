import { createGlobeModel } from "../generators/globe-generator.js?v=20260429a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../effects/bloom/bloom-config.js?v=20260426a";
import { GLOBE_MATERIAL_CONFIG } from "../materials/globe/globe-config.js?v=20260429a";
import { createGlobeMaterial } from "../materials/globe/globe-material.js?v=20260429b";

export function renderGlobePreview({
  root,
  orbDiameterPx,
} = {}) {
  if (!root) return null;

  const bo = Number(orbDiameterPx) || 72;
  const inspector = createWorldObjectInspector({
    root,
    bo,
    cameraPositionBo: Object.freeze({ x: 0.82, y: 0.18, z: 3.15 }),
    minDistanceBo: 0.9,
    maxDistanceBo: 28,
    enableShadows: false,
    bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
  });
  if (!inspector) return null;

  const material = createGlobeMaterial(GLOBE_MATERIAL_CONFIG);
  const { model, metrics } = createGlobeModel({
    bo,
    material,
    shellSegments: 32,
  });

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}
