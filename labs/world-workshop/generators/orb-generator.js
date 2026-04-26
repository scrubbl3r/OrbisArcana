import * as THREE from "three";
import { addLineLoop } from "../rendering/world-render-utils.js?v=20260426b";

export function getOrbMetrics({ bo = 72 } = {}) {
  const baseOrb = Number(bo) || 72;
  return Object.freeze({
    bo: baseOrb,
    radius: baseOrb * 0.5,
    diameter: baseOrb,
    shellSegments: 48,
    ringSegments: 96,
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

export function createOrbModel({
  bo = 72,
  shellMaterial,
  coreMaterial = null,
  edgeMaterials = [],
  edgeColor = 0xffffff,
  edgeWidth = 2,
  includeCore = true,
  includeRibs = true,
} = {}) {
  const metrics = getOrbMetrics({ bo });
  const model = new THREE.Group();

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(metrics.radius, metrics.shellSegments, metrics.shellSegments * 0.5),
    shellMaterial
  );
  model.add(shell);

  if (includeCore && coreMaterial) {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(metrics.radius * 0.36, 32, 16),
      coreMaterial
    );
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

  return Object.freeze({ model, metrics });
}
