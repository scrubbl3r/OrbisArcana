import * as THREE from "three";
import { createOrb3dRuntime } from "../../../game-runtime/orb/orb-3d-runtime.js";
import {
  LEVEL_DEPTH_CAMERA_FOV_DEG,
  LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS,
  LEVEL_DEPTH_DEFAULT_ORB_Z_BO,
  resolveApparentDepthScale,
  resolveDepthCameraZ,
  resolveOrbTravelZBO,
} from "../../../game-runtime/level/depth-projection.js";

const BO_WORLD_UNITS = LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS;
const PREVIEW_RASTER_SIZE = 384;
const DEPTH_LAYER_ALPHA_THRESHOLD = 8;
const DEPTH_CAMERA_FOV_DEG = LEVEL_DEPTH_CAMERA_FOV_DEG;
const DEPTH_ENVIRONMENT_MODE = Object.freeze({
  runtime: "runtime",
  debug: "debug",
});

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

function escapeXml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveDepthLayerLabel(depthLayers = []) {
  const layers = Array.isArray(depthLayers) ? depthLayers : [];
  if (!layers.length) return "no depth layer";
  return layers.map((layer) => String(layer && layer.label || layer && layer.id || "depth")).join(" / ");
}

function buildLayerSvgMarkup(layer = {}, viewBox = {}) {
  const vbX = clampNumber(viewBox.x, 0);
  const vbY = clampNumber(viewBox.y, 0);
  const vbW = Math.max(1, clampNumber(viewBox.width, 1));
  const vbH = Math.max(1, clampNumber(viewBox.height, 1));
  const defs = (Array.isArray(layer.defsMarkup) ? layer.defsMarkup : []).join("");
  const tx = clampNumber(layer.translate && layer.translate.x, 0);
  const ty = clampNumber(layer.translate && layer.translate.y, 0);
  const body = String(layer.authoredBody || "");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" width="${vbW}" height="${vbH}">${defs}<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="white" fill-opacity="0"></rect><g transform="translate(${tx} ${ty})">${body}</g></svg>`;
}

function loadImageFromSvgMarkup(markup = "") {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Depth SVG raster image failed to load"));
    image.src = encoded;
  });
}

function resolveRasterBox(imageData, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const data = imageData && imageData.data ? imageData.data : null;
  if (!data) return null;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width) + x) * 4 + 3];
      if (alpha <= DEPTH_LAYER_ALPHA_THRESHOLD) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return Object.freeze({ minX, minY, maxX, maxY });
}

function samplePixel(imageData, width, height, x, y) {
  const px = Math.max(0, Math.min(width - 1, Math.round(x)));
  const py = Math.max(0, Math.min(height - 1, Math.round(y)));
  const index = ((py * width) + px) * 4;
  const data = imageData.data;
  const alpha = clampNumber(data[index + 3], 0) / 255;
  const luma = (
    clampNumber(data[index], 255) * 0.2126
    + clampNumber(data[index + 1], 255) * 0.7152
    + clampNumber(data[index + 2], 255) * 0.0722
  ) / 255;
  return Object.freeze({
    alpha,
    depth: alpha > 0.03 ? (1 - clamp01(luma)) : 0,
  });
}

function resolveDepthEnvironmentMode() {
  try {
    const params = new URLSearchParams(globalThis.location && globalThis.location.search || "");
    const raw = String(params.get("depth3dEnv") || "").trim().toLowerCase();
    return raw === DEPTH_ENVIRONMENT_MODE.debug
      ? DEPTH_ENVIRONMENT_MODE.debug
      : DEPTH_ENVIRONMENT_MODE.runtime;
  } catch (_) {
    return DEPTH_ENVIRONMENT_MODE.runtime;
  }
}

function buildGraphiteMaterial({
  opacity = 0.78,
  color = 0x33383e,
  environmentMode = DEPTH_ENVIRONMENT_MODE.runtime,
} = {}) {
  const runtimeMode = environmentMode !== DEPTH_ENVIRONMENT_MODE.debug;
  const resolvedOpacity = runtimeMode ? 1 : opacity;
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0.02,
    transparent: resolvedOpacity < 1,
    opacity: resolvedOpacity,
    side: THREE.DoubleSide,
    depthWrite: runtimeMode,
  });
}

function applyEnvironmentMeshFlags(object = null, {
  receiveShadow = true,
  castShadow = true,
} = {}) {
  if (!object || typeof object.traverse !== "function") return;
  object.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.receiveShadow = !!receiveShadow;
    node.castShadow = !!castShadow;
  });
}

function applyActorOverlayFlags(object = null) {
  if (!object || typeof object.traverse !== "function") return;
  object.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.frustumCulled = false;
    node.renderOrder = 20;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (!material) return;
      material.depthTest = false;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  });
}

function toWorldX(authorX, viewBox, worldWidthPx) {
  const vbX = clampNumber(viewBox.x, 0);
  const vbW = Math.max(1, clampNumber(viewBox.width, 1));
  return ((authorX - vbX) / vbW) * Math.max(1, clampNumber(worldWidthPx, 1));
}

function toWorldY(authorY, viewBox, worldHeightPx) {
  const vbY = clampNumber(viewBox.y, 0);
  const vbH = Math.max(1, clampNumber(viewBox.height, 1));
  return ((authorY - vbY) / vbH) * Math.max(1, clampNumber(worldHeightPx, 1));
}

function toThreeX(worldX, worldWidthPx) {
  return clampNumber(worldX, 0) - (Math.max(1, clampNumber(worldWidthPx, 1)) * 0.5);
}

function toThreeY(worldY, worldHeightPx) {
  return (Math.max(1, clampNumber(worldHeightPx, 1)) * 0.5) - clampNumber(worldY, 0);
}

function addQuad(positions, indices, colors, a, b, c, d, color) {
  const base = positions.length / 3;
  for (const point of [a, b, c, d]) {
    positions.push(point.x, point.y, point.z);
    colors.push(color.r, color.g, color.b);
  }
  indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function toThreePointFromWorld(point = {}, worldWidthPx = 1, worldHeightPx = 1, z = 0) {
  return Object.freeze({
    x: toThreeX(clampNumber(point && point.xW, 0), worldWidthPx),
    y: toThreeY(clampNumber(point && point.yW, 0), worldHeightPx),
    z,
  });
}

function buildVectorLoopShape(loop = {}, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  const cleanPoints = points.length > 1
    ? points.filter((point, index) => {
        if (index <= 0) return true;
        const prev = points[index - 1] || {};
        return (
          Math.abs(clampNumber(point && point.xW, 0) - clampNumber(prev && prev.xW, 0)) > 0.001
          || Math.abs(clampNumber(point && point.yW, 0) - clampNumber(prev && prev.yW, 0)) > 0.001
        );
      })
    : points;
  if (cleanPoints.length < 3) return null;
  const start = toThreePointFromWorld(cleanPoints[0], worldWidthPx, worldHeightPx, 0);
  const shape = new THREE.Shape();
  shape.moveTo(start.x, start.y);
  for (let i = 1; i < cleanPoints.length; i += 1) {
    const p = toThreePointFromWorld(cleanPoints[i], worldWidthPx, worldHeightPx, 0);
    shape.lineTo(p.x, p.y);
  }
  shape.closePath();
  return shape;
}

function buildVectorWallGeometry(loop = {}, depthPx = 0, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  const positions = [];
  const indices = [];
  const colors = [];
  const wallColor = new THREE.Color(0x2b3137);
  if (points.length < 3) return null;
  for (let i = 1; i < points.length; i += 1) {
    const aTop = toThreePointFromWorld(points[i - 1], worldWidthPx, worldHeightPx, 0);
    const bTop = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 0);
    const bBack = Object.freeze({ ...bTop, z: -depthPx });
    const aBack = Object.freeze({ ...aTop, z: -depthPx });
    addQuad(positions, indices, colors, aTop, bTop, bBack, aBack, wallColor);
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildVectorLoopEdges(loop = {}, depthPx = 0, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  const positions = [];
  if (points.length < 2) return null;
  for (let i = 1; i < points.length; i += 1) {
    const a = toThreePointFromWorld(points[i - 1], worldWidthPx, worldHeightPx, 1);
    const b = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 1);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    positions.push(a.x, a.y, -depthPx, b.x, b.y, -depthPx);
  }
  for (let i = 0; i < points.length; i += 1) {
    const top = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 1);
    positions.push(top.x, top.y, 1, top.x, top.y, -depthPx);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function buildVectorDepthLayerMesh({ layer, worldWidthPx, worldHeightPx, environmentMode = DEPTH_ENVIRONMENT_MODE.runtime }) {
  const loops = Array.isArray(layer && layer.loops) ? layer.loops : [];
  const primaryLoop = loops[0] || null;
  const shape = buildVectorLoopShape(primaryLoop, worldWidthPx, worldHeightPx);
  if (!shape) return null;
  const depthPx = Math.max(0, clampNumber(layer && layer.maxDepthBO, 10)) * BO_WORLD_UNITS;
  const model = new THREE.Group();
  model.name = `depth:${String(layer && layer.id || "layer")}:vector_volume`;
  model.userData.depthLayer = layer;
  model.userData.worldWidthPx = worldWidthPx;
  model.userData.worldHeightPx = worldHeightPx;
  model.userData.depthPx = depthPx;

  const floorShape = buildVectorLoopShape(primaryLoop, worldWidthPx, worldHeightPx);
  const floorGeometry = new THREE.ShapeGeometry(floorShape || shape);
  floorGeometry.translate(0, 0, -depthPx);
  const floorMaterial = buildGraphiteMaterial({ opacity: 0.58, color: 0x303941, environmentMode });
  if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) floorMaterial.depthWrite = false;
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.renderOrder = 1;
  floor.name = `${model.name}:floor`;
  model.userData.floorMesh = floor;
  model.add(floor);

  const ceilingGeometry = new THREE.ShapeGeometry(shape);
  ceilingGeometry.translate(0, 0, 0);
  const ceilingMaterial = buildGraphiteMaterial({ opacity: 0.08, color: 0x6a7480, environmentMode });
  if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) ceilingMaterial.depthWrite = false;
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.renderOrder = 3;
  ceiling.name = `${model.name}:ceiling`;
  model.add(ceiling);

  for (const loop of loops) {
    const wallGeometry = buildVectorWallGeometry(loop, depthPx, worldWidthPx, worldHeightPx);
    if (wallGeometry) {
      const wallMaterial = buildGraphiteMaterial({ opacity: 0.80, color: 0x232a31, environmentMode });
      wallMaterial.vertexColors = true;
      wallMaterial.needsUpdate = true;
      if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) wallMaterial.depthWrite = false;
      const walls = new THREE.Mesh(wallGeometry, wallMaterial);
      walls.renderOrder = 2;
      walls.name = `${model.name}:walls`;
      walls.userData.loop = loop;
      model.add(walls);
    }
    const edgeGeometry = buildVectorLoopEdges(loop, depthPx, worldWidthPx, worldHeightPx);
    if (edgeGeometry) {
      const edges = new THREE.LineSegments(
        edgeGeometry,
        new THREE.LineBasicMaterial({
          color: 0x66727d,
          transparent: true,
          opacity: environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.56 : 0.42,
          depthTest: true,
          depthWrite: false,
        })
      );
      edges.renderOrder = 4;
      edges.userData.loop = loop;
      model.add(edges);
    }
  }

  return model;
}

function buildDepthGeometryFromSamples({ samples, cols, rows, layer, viewBox, rasterBox, rasterSize, worldWidthPx, worldHeightPx }) {
  const positions = [];
  const indices = [];
  const colors = [];
  const depthBO = Math.max(0, clampNumber(layer.maxDepthBO, 10));
  const maxDepth = depthBO * BO_WORLD_UNITS;
  const color = new THREE.Color(0x30363c);
  const wallColor = new THREE.Color(0x24292f);
  const floorColor = new THREE.Color(0x3b4248);
  const authorW = Math.max(1, clampNumber(viewBox.width, 1));
  const authorH = Math.max(1, clampNumber(viewBox.height, 1));
  const boxW = Math.max(1, rasterBox.maxX - rasterBox.minX + 1);
  const boxH = Math.max(1, rasterBox.maxY - rasterBox.minY + 1);

  const vertexAt = (gx, gy, depthValue = 0) => {
    const rx = rasterBox.minX + ((gx / cols) * boxW);
    const ry = rasterBox.minY + ((gy / rows) * boxH);
    const authorX = clampNumber(viewBox.x, 0) + ((rx / Math.max(1, rasterSize.width - 1)) * authorW);
    const authorY = clampNumber(viewBox.y, 0) + ((ry / Math.max(1, rasterSize.height - 1)) * authorH);
    const worldX = toWorldX(authorX, viewBox, worldWidthPx);
    const worldY = toWorldY(authorY, viewBox, worldHeightPx);
    return Object.freeze({
      x: toThreeX(worldX, worldWidthPx),
      y: toThreeY(worldY, worldHeightPx),
      z: -Math.max(0, depthValue) * maxDepth,
    });
  };

  const sampleAt = (x, y) => samples[(y * cols) + x] || Object.freeze({ alpha: 0, depth: 0 });
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sample = sampleAt(col, row);
      if (sample.alpha <= 0.03) continue;
      const d00 = sample.depth;
      const d10 = sampleAt(Math.min(cols - 1, col + 1), row).depth || d00;
      const d11 = sampleAt(Math.min(cols - 1, col + 1), Math.min(rows - 1, row + 1)).depth || d00;
      const d01 = sampleAt(col, Math.min(rows - 1, row + 1)).depth || d00;
      const shade = 0.68 + (d00 * 0.28);
      color.setRGB(floorColor.r * shade, floorColor.g * shade, floorColor.b * shade);
      addQuad(
        positions,
        indices,
        colors,
        vertexAt(col, row, d00),
        vertexAt(col + 1, row, d10),
        vertexAt(col + 1, row + 1, d11),
        vertexAt(col, row + 1, d01),
        color
      );

      const neighbors = [
        { dx: -1, dy: 0, a: vertexAt(col, row, d00), b: vertexAt(col, row + 1, d01) },
        { dx: 1, dy: 0, a: vertexAt(col + 1, row + 1, d11), b: vertexAt(col + 1, row, d10) },
        { dx: 0, dy: -1, a: vertexAt(col + 1, row, d10), b: vertexAt(col, row, d00) },
        { dx: 0, dy: 1, a: vertexAt(col, row + 1, d01), b: vertexAt(col + 1, row + 1, d11) },
      ];
      for (const edge of neighbors) {
        const neighbor = sampleAt(col + edge.dx, row + edge.dy);
        if (neighbor.alpha > 0.03) continue;
        const topA = Object.freeze({ ...edge.a, z: 0 });
        const topB = Object.freeze({ ...edge.b, z: 0 });
        addQuad(positions, indices, colors, topA, topB, edge.b, edge.a, wallColor);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildCeilingGeometryFromSamples({ samples, cols, rows, viewBox, rasterBox, rasterSize, worldWidthPx, worldHeightPx }) {
  const positions = [];
  const indices = [];
  const authorW = Math.max(1, clampNumber(viewBox.width, 1));
  const authorH = Math.max(1, clampNumber(viewBox.height, 1));
  const boxW = Math.max(1, rasterBox.maxX - rasterBox.minX + 1);
  const boxH = Math.max(1, rasterBox.maxY - rasterBox.minY + 1);
  const sampleAt = (x, y) => samples[(y * cols) + x] || Object.freeze({ alpha: 0 });
  const vertexAt = (gx, gy) => {
    const rx = rasterBox.minX + ((gx / cols) * boxW);
    const ry = rasterBox.minY + ((gy / rows) * boxH);
    const authorX = clampNumber(viewBox.x, 0) + ((rx / Math.max(1, rasterSize.width - 1)) * authorW);
    const authorY = clampNumber(viewBox.y, 0) + ((ry / Math.max(1, rasterSize.height - 1)) * authorH);
    const worldX = toWorldX(authorX, viewBox, worldWidthPx);
    const worldY = toWorldY(authorY, viewBox, worldHeightPx);
    return Object.freeze({
      x: toThreeX(worldX, worldWidthPx),
      y: toThreeY(worldY, worldHeightPx),
      z: 0,
    });
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sample = sampleAt(col, row);
      if (sample.alpha <= 0.03) continue;
      const base = positions.length / 3;
      for (const point of [
        vertexAt(col, row),
        vertexAt(col + 1, row),
        vertexAt(col + 1, row + 1),
        vertexAt(col, row + 1),
      ]) {
        positions.push(point.x, point.y, point.z);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

async function buildDepthLayerMesh({ layer, viewBox, worldWidthPx, worldHeightPx, environmentMode = DEPTH_ENVIRONMENT_MODE.runtime }) {
  const vectorMesh = buildVectorDepthLayerMesh({ layer, worldWidthPx, worldHeightPx, environmentMode });
  if (vectorMesh) return vectorMesh;

  const aspect = Math.max(0.1, clampNumber(viewBox.width, 1) / Math.max(1, clampNumber(viewBox.height, 1)));
  const rasterWidth = aspect >= 1 ? PREVIEW_RASTER_SIZE : Math.max(64, Math.round(PREVIEW_RASTER_SIZE * aspect));
  const rasterHeight = aspect >= 1 ? Math.max(64, Math.round(PREVIEW_RASTER_SIZE / aspect)) : PREVIEW_RASTER_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = rasterWidth;
  canvas.height = rasterHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const image = await loadImageFromSvgMarkup(buildLayerSvgMarkup(layer, viewBox));
  ctx.clearRect(0, 0, rasterWidth, rasterHeight);
  ctx.drawImage(image, 0, 0, rasterWidth, rasterHeight);
  const imageData = ctx.getImageData(0, 0, rasterWidth, rasterHeight);
  const rasterBox = resolveRasterBox(imageData, rasterWidth, rasterHeight);
  if (!rasterBox) return null;
  const tess = Math.max(2, Math.round(clampNumber(layer.tessellation, 24)));
  const boxW = Math.max(1, rasterBox.maxX - rasterBox.minX + 1);
  const boxH = Math.max(1, rasterBox.maxY - rasterBox.minY + 1);
  const cols = Math.max(2, tess);
  const rows = Math.max(2, Math.round(tess * (boxH / boxW)));
  const samples = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = rasterBox.minX + (((col + 0.5) / cols) * boxW);
      const y = rasterBox.minY + (((row + 0.5) / rows) * boxH);
      samples.push(samplePixel(imageData, rasterWidth, rasterHeight, x, y));
    }
  }
  const geometry = buildDepthGeometryFromSamples({
    samples,
    cols,
    rows,
    layer,
    viewBox,
    rasterBox,
    rasterSize: { width: rasterWidth, height: rasterHeight },
    worldWidthPx,
    worldHeightPx,
  });
  const material = buildGraphiteMaterial({ opacity: 0.86, environmentMode });
  material.vertexColors = true;
  material.needsUpdate = true;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `depth:${String(layer.id || "layer")}`;
  const ceilingGeometry = buildCeilingGeometryFromSamples({
    samples,
    cols,
    rows,
    viewBox,
    rasterBox,
    rasterSize: { width: rasterWidth, height: rasterHeight },
    worldWidthPx,
    worldHeightPx,
  });
  const ceilingMaterial = buildGraphiteMaterial({ opacity: 0.14, color: 0x59616a, environmentMode });
  if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) ceilingMaterial.depthWrite = false;
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.name = `depth:${String(layer.id || "layer")}:ceiling`;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: 0x8f98a2,
      transparent: true,
      opacity: environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.36 : 0.30,
      depthTest: true,
      depthWrite: false,
    })
  );
  const model = new THREE.Group();
  model.name = `depth:${String(layer.id || "layer")}:sealed_volume`;
  model.add(mesh);
  model.add(ceiling);
  model.add(edges);
  return model;
}

export function createLevelStageDepth3dLayer({
  root = null,
  labelEl = null,
} = {}) {
  if (!root) return null;
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(DEPTH_CAMERA_FOV_DEG, 1, 1, 24000);
  camera.up.set(0, 1, 0);
  const environmentMode = resolveDepthEnvironmentMode();
  root.dataset.depthEnvironmentMode = environmentMode;
  scene.add(new THREE.AmbientLight(0xaeb9c5, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.25 : 0.08));
  const key = new THREE.DirectionalLight(0xdfeeff, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 1.15 : 0.34);
  key.position.set(-0.3, -0.5, 1.0);
  key.castShadow = false;
  scene.add(key);
  const group = new THREE.Group();
  const actorGroup = new THREE.Group();
  scene.add(group);
  scene.add(actorGroup);

  let disposed = false;
  let worldWidthPx = 1;
  let worldHeightPx = 1;
  let depthLayerCount = 0;
  let lastFrame = null;
  let orbRuntime = null;
  let orbRuntimeBO = 0;
  let currentOrbZBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO;
  let currentOrbDepthPx = currentOrbZBO * BO_WORLD_UNITS;

  function setLabel(text) {
    if (labelEl) {
      labelEl.dataset.depth3d = text;
    }
  }

  function clearGroup() {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((node) => {
        if (node.geometry && typeof node.geometry.dispose === "function") node.geometry.dispose();
        if (node.material && typeof node.material.dispose === "function") node.material.dispose();
      });
    }
  }

  function disposeOrbRuntime() {
    if (orbRuntime && typeof orbRuntime.dispose === "function") {
      orbRuntime.dispose();
    }
    orbRuntime = null;
    orbRuntimeBO = 0;
  }

  function syncRootVisibility() {
    root.hidden = depthLayerCount <= 0 && !orbRuntime;
  }

  function renderFrame({
    camLeft = 0,
    camTop = 0,
    zoom = 1,
    viewportWidthPx = 0,
    viewportHeightPx = 0,
    isBootFrame = false,
  } = {}) {
    if (disposed) return;
    lastFrame = {
      camLeft,
      camTop,
      zoom,
      viewportWidthPx,
      viewportHeightPx,
      isBootFrame,
    };
    const width = Math.max(1, Math.round(clampNumber(viewportWidthPx, root.clientWidth || 1)));
    const height = Math.max(1, Math.round(clampNumber(viewportHeightPx, root.clientHeight || 1)));
    renderer.setSize(width, height, false);
    const safeZoom = Math.max(0.05, clampNumber(zoom, 1));
    const viewW = width / safeZoom;
    const viewH = height / safeZoom;
    const centerXW = clampNumber(camLeft, 0) + (viewW * 0.5);
    const centerYW = clampNumber(camTop, 0) + (viewH * 0.5);
    const cx = toThreeX(centerXW, worldWidthPx);
    const cy = toThreeY(centerYW, worldHeightPx);
    const cameraZ = resolveDepthCameraZ({
      viewportHeightPx: height,
      zoom: safeZoom,
      fovDeg: camera.fov,
    });
    camera.aspect = width / height;
    camera.near = Math.max(1, cameraZ * 0.02);
    camera.far = Math.max(24000, cameraZ + (BO_WORLD_UNITS * 32));
    camera.position.set(cx, cy, cameraZ);
    camera.lookAt(cx, cy, 0);
    camera.updateProjectionMatrix();
    if (orbRuntime && typeof orbRuntime.setTime === "function") {
      orbRuntime.setTime(performance.now() / 1000);
      if (typeof orbRuntime.setScale === "function") {
        orbRuntime.setScale(resolveApparentDepthScale({
          cameraZ,
          depthPx: currentOrbDepthPx,
        }));
      }
    }
    renderer.render(scene, camera);
  }

  function resolveBootFrame(layers = []) {
    const width = Math.max(1, Math.round(root.clientWidth || (globalThis.innerWidth || 1)));
    const height = Math.max(1, Math.round(root.clientHeight || (globalThis.innerHeight || 1)));
    const boxes = (Array.isArray(layers) ? layers : [])
      .map((layer) => layer && layer.boundaryBox ? layer.boundaryBox : null)
      .filter(Boolean);
    if (!boxes.length) {
      return Object.freeze({
        camLeft: 0,
        camTop: 0,
        zoom: 1,
        viewportWidthPx: width,
        viewportHeightPx: height,
      });
    }
    const left = Math.min(...boxes.map((box) => clampNumber(box.leftXW, 0)));
    const top = Math.min(...boxes.map((box) => clampNumber(box.topYW, 0)));
    const right = Math.max(...boxes.map((box) => clampNumber(box.rightXW, 0)));
    const bottom = Math.max(...boxes.map((box) => clampNumber(box.bottomYW, 0)));
    const centerX = (left + right) * 0.5;
    const centerY = (top + bottom) * 0.5;
    return Object.freeze({
      camLeft: Math.max(0, centerX - (width * 0.5)),
      camTop: Math.max(0, centerY - (height * 0.5)),
      zoom: 1,
      viewportWidthPx: width,
      viewportHeightPx: height,
    });
  }

  return Object.freeze({
    async loadScene(authoredScene = null, state = null) {
      if (disposed) return;
      clearGroup();
      const summary = authoredScene && authoredScene.summary ? authoredScene.summary : null;
      const layers = Array.isArray(summary && summary.depthLayers) ? summary.depthLayers : [];
      worldWidthPx = Math.max(1, clampNumber(state && state.worldWidthPx, worldWidthPx));
      worldHeightPx = Math.max(1, clampNumber(state && state.worldHeightPx, worldHeightPx));
      depthLayerCount = layers.length;
      currentOrbZBO = resolveOrbTravelZBO(summary, LEVEL_DEPTH_DEFAULT_ORB_Z_BO);
      setLabel(resolveDepthLayerLabel(layers));
      for (const layer of layers) {
        const mesh = await buildDepthLayerMesh({
          layer,
          viewBox: summary.viewBox || { x: 0, y: 0, width: worldWidthPx, height: worldHeightPx },
          worldWidthPx,
          worldHeightPx,
          environmentMode,
        });
        if (mesh) {
          applyEnvironmentMeshFlags(mesh);
          group.add(mesh);
        }
      }
      syncRootVisibility();
      root.dataset.depthLayerCount = String(group.children.length);
      root.dataset.depthStatus = group.children.length ? "ready" : "empty";
      if (group.children.length) {
        renderFrame(lastFrame || { ...resolveBootFrame(layers), isBootFrame: true });
      }
    },
    setOrbWorldPosition({
      xW = null,
      yW = null,
      bo = BO_WORLD_UNITS,
      zBO = currentOrbZBO,
    } = {}) {
      if (disposed) return false;
      const worldX = Number(xW);
      const worldY = Number(yW);
      if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return false;
      const resolvedBO = Math.max(1, Number(bo) || BO_WORLD_UNITS);
      if (!orbRuntime || Math.abs(resolvedBO - orbRuntimeBO) > 0.001) {
        disposeOrbRuntime();
        orbRuntime = createOrb3dRuntime({
          bo: resolvedBO,
          includeCore: false,
          includeRibs: false,
        });
        orbRuntimeBO = resolvedBO;
        applyEnvironmentMeshFlags(orbRuntime.model, {
          receiveShadow: false,
          castShadow: true,
        });
        applyActorOverlayFlags(orbRuntime.model);
        actorGroup.add(orbRuntime.model);
        if (orbRuntime.shadowSpot) actorGroup.add(orbRuntime.shadowSpot);
      }
      const resolvedZBO = Math.max(0, Number.isFinite(Number(zBO)) ? Number(zBO) : currentOrbZBO);
      currentOrbDepthPx = resolvedZBO * resolvedBO;
      orbRuntime.setPosition({
        x: toThreeX(worldX, worldWidthPx),
        y: toThreeY(worldY, worldHeightPx),
        z: -currentOrbDepthPx,
      });
      syncRootVisibility();
      if (lastFrame) renderFrame(lastFrame);
      return true;
    },
    renderFrame,
    dispose() {
      disposed = true;
      disposeOrbRuntime();
      clearGroup();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  });
}
