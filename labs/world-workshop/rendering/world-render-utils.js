import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

export const WORLD_FACE_COLOR = 0x000000;
export const WORLD_EDGE_COLOR = 0xffffff;

export function createWorldFaceMaterial({
  color = WORLD_FACE_COLOR,
  side = THREE.DoubleSide,
} = {}) {
  return new THREE.MeshBasicMaterial({ color, side });
}

export function disposeObject(object) {
  if (!object || typeof object.traverse !== "function") return;
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    }
  });
}

export function addLineEdges(mesh, {
  color = WORLD_EDGE_COLOR,
  linewidth = 2,
  thresholdAngle = 16,
  edgeMaterials = [],
} = {}) {
  if (!mesh || !mesh.geometry || !mesh.parent) return null;
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const positions = Array.from(edges.getAttribute("position").array);
  const lineGeometry = new LineSegmentsGeometry();
  lineGeometry.setPositions(positions);
  edges.dispose();

  const material = new LineMaterial({
    color,
    linewidth,
    worldUnits: false,
  });
  edgeMaterials.push(material);

  const lines = new LineSegments2(lineGeometry, material);
  lines.computeLineDistances();
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  lines.scale.copy(mesh.scale);
  mesh.parent.add(lines);
  return lines;
}

export function addOrbScaleGuide(group, {
  bo,
  y,
  color = WORLD_EDGE_COLOR,
} = {}) {
  if (!group) return null;
  const orbGuide = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.SphereGeometry((Number(bo) || 72) * 0.5, 32, 16), 16),
    new THREE.LineDashedMaterial({
      color,
      dashSize: 4,
      gapSize: 6,
      transparent: true,
      opacity: 0.22,
    })
  );
  orbGuide.position.set(0, Number(y) || 0, 0);
  orbGuide.computeLineDistances();
  group.add(orbGuide);
  return orbGuide;
}

