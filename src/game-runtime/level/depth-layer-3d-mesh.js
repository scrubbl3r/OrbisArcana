import * as THREE from "three";
import { LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS } from "./depth-projection.js";
import {
  toDepthThreeX,
  toDepthThreeY,
} from "./depth-runtime-coordinates.js";

const BO_WORLD_UNITS = LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS;
const PREVIEW_RASTER_SIZE = 384;
const DEPTH_LAYER_ALPHA_THRESHOLD = 8;
const DEPTH_GRAPHITE_RUNTIME = Object.freeze({
  faceColor: 0x707680,
  roughness: 0.58,
  metalness: 0.0,
  envMapIntensity: 0.22,
  clearcoat: 0.25,
  clearcoatRoughness: 0.7,
  specularIntensity: 0.28,
  specularColor: 0xd8f5ff,
  textureSize: 96,
  textureRepeat: 5,
  bumpScale: 0.2,
});

export const DEPTH_ENVIRONMENT_MODE = Object.freeze({
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

export function resolveDepthEnvironmentMode() {
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

function createGraphiteSurfaceTexture() {
  if (typeof document === "undefined") return null;
  const size = Math.max(16, DEPTH_GRAPHITE_RUNTIME.textureSize);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(size, size);
  for (let index = 0; index < image.data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % size;
    const y = Math.floor(pixel / size);
    const grain = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const value = 112 + Math.round((grain - Math.floor(grain)) * 28);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  context.globalAlpha = 0.22;
  for (let y = 0; y < size; y += 3) {
    context.fillStyle = y % 2 ? "#ffffff" : "#000000";
    context.fillRect(0, y, size, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(DEPTH_GRAPHITE_RUNTIME.textureRepeat, DEPTH_GRAPHITE_RUNTIME.textureRepeat);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function buildGraphiteMaterial({
  opacity = 0.78,
  color = 0x05070a,
  environmentMode = DEPTH_ENVIRONMENT_MODE.runtime,
} = {}) {
  const runtimeMode = environmentMode !== DEPTH_ENVIRONMENT_MODE.debug;
  const resolvedOpacity = runtimeMode ? 1 : opacity;
  if (!runtimeMode) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: 0x020304,
      roughness: 0.88,
      metalness: 0.02,
      transparent: resolvedOpacity < 1,
      opacity: resolvedOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  const surfaceTexture = createGraphiteSurfaceTexture();
  const material = new THREE.MeshPhysicalMaterial({
    color: DEPTH_GRAPHITE_RUNTIME.faceColor,
    roughness: DEPTH_GRAPHITE_RUNTIME.roughness,
    metalness: DEPTH_GRAPHITE_RUNTIME.metalness,
    envMapIntensity: DEPTH_GRAPHITE_RUNTIME.envMapIntensity,
    clearcoat: DEPTH_GRAPHITE_RUNTIME.clearcoat,
    clearcoatRoughness: DEPTH_GRAPHITE_RUNTIME.clearcoatRoughness,
    specularIntensity: DEPTH_GRAPHITE_RUNTIME.specularIntensity,
    specularColor: DEPTH_GRAPHITE_RUNTIME.specularColor,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  });
  if (surfaceTexture) {
    material.roughnessMap = surfaceTexture;
    material.bumpMap = surfaceTexture;
    material.bumpScale = DEPTH_GRAPHITE_RUNTIME.bumpScale;
  }
  return material;
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
    x: toDepthThreeX(clampNumber(point && point.xW, 0), worldWidthPx),
    y: toDepthThreeY(clampNumber(point && point.yW, 0), worldHeightPx),
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
          color: environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0x66727d : 0xf4fbff,
          transparent: true,
          opacity: environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.56 : 0.82,
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
      x: toDepthThreeX(worldX, worldWidthPx),
      y: toDepthThreeY(worldY, worldHeightPx),
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

export async function buildDepthLayerMesh({ layer, viewBox, worldWidthPx, worldHeightPx, environmentMode = DEPTH_ENVIRONMENT_MODE.runtime }) {
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
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0x8f98a2 : 0xf4fbff,
      transparent: true,
      opacity: environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.36 : 0.76,
      depthTest: true,
      depthWrite: false,
    })
  );
  const model = new THREE.Group();
  model.name = `depth:${String(layer.id || "layer")}:sealed_volume`;
  model.add(mesh);
  model.add(edges);
  return model;
}
