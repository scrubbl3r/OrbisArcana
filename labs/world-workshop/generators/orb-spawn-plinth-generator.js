import * as THREE from "three";

export function getOrbSpawnPlinthMetrics({ bo = 72 } = {}) {
  const baseOrb = Number(bo) || 72;
  const columnWidth = baseOrb * 0.8;
  const columnDepth = baseOrb * 0.8;
  const columnHeight = baseOrb * 1.5;
  const capitalWidth = baseOrb * 1.1;
  const capitalDepth = capitalWidth;
  const baseWidth = baseOrb * 1.35;
  const baseDepth = baseOrb * 1.35;
  const baseLowerHeight = baseOrb * 0.27;
  const baseUpperHeight = baseOrb * 0.21;
  const capCenterHeight = baseOrb * 0.15;
  const plinthHeight = baseLowerHeight + baseUpperHeight + columnHeight + capCenterHeight;
  const columnCenterY = baseLowerHeight + baseUpperHeight + columnHeight * 0.5;

  return Object.freeze({
    bo: baseOrb,
    columnWidth,
    columnDepth,
    columnHeight,
    capitalWidth,
    capitalDepth,
    baseWidth,
    baseDepth,
    baseLowerHeight,
    baseUpperHeight,
    capCenterHeight,
    plinthHeight,
    columnCenterY,
  });
}

function addBox(group, {
  width,
  height,
  depth,
  x = 0,
  y = 0,
  z = 0,
  material,
  decorateMesh = null,
}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  if (typeof decorateMesh === "function") decorateMesh(mesh);
  return mesh;
}

function addNonagonColumn(group, {
  width,
  depth,
  height,
  x = 0,
  y = 0,
  z = 0,
  material,
  decorateMesh = null,
}) {
  const radiusX = width * 0.5;
  const radiusZ = depth * 0.5;
  const geometry = new THREE.CylinderGeometry(1, 1, height, 9, 1, false, Math.PI * -0.5);
  geometry.scale(radiusX, 1, radiusZ);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  if (typeof decorateMesh === "function") decorateMesh(mesh);
  return mesh;
}

export function createOrbSpawnPlinthModel({
  bo = 72,
  material,
  decorateMesh = null,
} = {}) {
  const metrics = getOrbSpawnPlinthMetrics({ bo });
  const model = new THREE.Group();
  model.position.y = -metrics.columnCenterY;

  let y = 0;
  addBox(model, {
    width: metrics.baseWidth,
    height: metrics.baseLowerHeight,
    depth: metrics.baseDepth,
    y: y + metrics.baseLowerHeight * 0.5,
    material,
    decorateMesh,
  });
  y += metrics.baseLowerHeight;

  addBox(model, {
    width: metrics.baseWidth * 0.86,
    height: metrics.baseUpperHeight,
    depth: metrics.baseDepth * 0.86,
    y: y + metrics.baseUpperHeight * 0.5,
    material,
    decorateMesh,
  });
  y += metrics.baseUpperHeight;

  addNonagonColumn(model, {
    width: metrics.columnWidth,
    height: metrics.columnHeight,
    depth: metrics.columnDepth,
    y: y + metrics.columnHeight * 0.5,
    material,
    decorateMesh,
  });
  y += metrics.columnHeight;

  addBox(model, {
    width: metrics.capitalWidth,
    height: metrics.capCenterHeight,
    depth: metrics.capitalDepth,
    y: y + metrics.capCenterHeight * 0.5,
    material,
    decorateMesh,
  });

  return Object.freeze({ model, metrics });
}

