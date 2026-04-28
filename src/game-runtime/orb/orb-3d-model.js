import * as THREE from "three";
import { addLineLoop } from "../rendering/three/three-line-utils.js";

export function getOrb3dMetrics({
  bo = 72,
  shellSegments = 48,
  ringSegments = 96,
} = {}) {
  const baseOrb = Number(bo) || 72;
  const resolvedShellSegments = Math.max(16, Math.round(Number(shellSegments) || 48));
  return Object.freeze({
    bo: baseOrb,
    radius: baseOrb * 0.5,
    diameter: baseOrb,
    shellSegments: resolvedShellSegments,
    ringSegments: Math.max(24, Math.round(Number(ringSegments) || resolvedShellSegments * 2)),
  });
}

function circlePoints({
  radius,
  segments,
  plane = "xy",
} = {}) {
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const a = Math.cos(angle) * radius;
    const b = Math.sin(angle) * radius;
    switch (plane) {
      case "xz":
        points.push(new THREE.Vector3(a, 0, b));
        break;
      case "yz":
        points.push(new THREE.Vector3(0, a, b));
        break;
      case "xy":
      default:
        points.push(new THREE.Vector3(a, b, 0));
        break;
    }
  }
  return points;
}

export function createOrb3dModel({
  bo = 72,
  shellMaterial,
  coreMaterial = null,
  edgeMaterials = [],
  edgeColor = 0xffffff,
  edgeWidth = 2,
  includeCore = true,
  includeRibs = true,
  shellSegments = 48,
  ringSegments = 96,
} = {}) {
  const metrics = getOrb3dMetrics({ bo, shellSegments, ringSegments });
  const model = new THREE.Group();

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(metrics.radius, metrics.shellSegments, metrics.shellSegments * 0.5),
    shellMaterial
  );
  shell.name = "orb3d:shell";
  model.add(shell);

  if (includeCore && coreMaterial) {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(metrics.radius * 0.36, 32, 16),
      coreMaterial
    );
    core.name = "orb3d:core";
    model.add(core);
  }

  if (includeRibs) {
    ["xy", "xz", "yz"].forEach((plane) => {
      addLineLoop(model, {
        points: circlePoints({
          radius: metrics.radius,
          segments: metrics.ringSegments,
          plane,
        }),
        color: edgeColor,
        linewidth: edgeWidth,
        edgeMaterials,
      });
    });
  }

  model.name = "orb3d:model";
  return Object.freeze({ model, metrics });
}

export const getOrbMetrics = getOrb3dMetrics;
export const createOrbModel = createOrb3dModel;
