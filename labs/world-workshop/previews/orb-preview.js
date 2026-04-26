import * as THREE from "three";
import { createOrbModel } from "../generators/orb-generator.js?v=20260426a";
import { createWorldObjectInspector } from "../inspectors/world-object-inspector.js?v=20260426a";

export function renderOrbPreview({
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
  });
  if (!inspector) return null;

  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x9beaff,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const { model, metrics } = createOrbModel({
    bo,
    shellMaterial,
    coreMaterial,
    edgeMaterials: inspector.edgeMaterials,
  });

  inspector.scene.add(model);
  inspector.render();
  return metrics;
}

