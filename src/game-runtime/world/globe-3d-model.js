import * as THREE from "three";

export function getGlobe3dMetrics({
  bo = 72,
  shellSegments = 32,
} = {}) {
  const baseOrb = Number(bo) || 72;
  const resolvedShellSegments = Math.max(16, Math.round(Number(shellSegments) || 32));
  return Object.freeze({
    bo: baseOrb,
    radius: baseOrb * 0.5,
    diameter: baseOrb,
    shellSegments: resolvedShellSegments,
  });
}

export function createGlobe3dModel({
  bo = 72,
  material,
  shellSegments = 32,
} = {}) {
  const metrics = getGlobe3dMetrics({ bo, shellSegments });
  const model = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(metrics.radius, metrics.shellSegments, Math.max(12, Math.round(metrics.shellSegments * 0.5))),
    material
  );
  shell.name = "globe3d:shell";
  model.add(shell);
  model.name = "globe3d:model";
  return Object.freeze({ model, metrics });
}

export const getGlobeMetrics = getGlobe3dMetrics;
export const createGlobeModel = createGlobe3dModel;
