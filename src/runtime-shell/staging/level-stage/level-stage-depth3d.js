import * as THREE from "three";
import { createOrb3dActorRuntime } from "../../../game-runtime/orb/orb-3d-actor-runtime.js?v=20260430a";
import {
  LEVEL_DEPTH_CAMERA_FOV_DEG,
  LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS,
  LEVEL_DEPTH_DEFAULT_ORB_Z_BO,
  resolveDepthCameraZ,
  resolveOrbTravelZBO,
} from "../../../game-runtime/level/depth-projection.js";
import { createGraphiteMaterial } from "../../../game-runtime/rendering/three/materials/graphite-material.js";
import { GRAPHITE_CONFIG } from "../../../game-runtime/rendering/three/materials/graphite-config.js";
import { addLineEdges } from "../../../game-runtime/rendering/three/three-line-utils.js";
import { disposeThreeObject } from "../../../game-runtime/rendering/three/three-object-utils.js";
import { createPlinthModel } from "../../../game-runtime/world/props/plinth-model.js";
import { createGlobe3dModel } from "../../../game-runtime/world/globe-3d-model.js";
import { createGlobeMaterial, createGlobePointLight } from "../../../game-runtime/world/globe-3d-material.js";
import { WORLD_GLOBE_3D_VISUAL_DEFAULTS } from "../../../game-runtime/world/world-globe-3d-default.js?v=20260429b";
import { createWorldGlobe3dRuntime } from "../../../game-runtime/world/world-globe-3d-runtime.js?v=20260430a";
import { ORB_GLOBE_3D_VISUAL_DEFAULTS } from "../../../game-runtime/orb/orb-globe-3d-default.js?v=20260429b";
import { createOrbGlobe3dRuntime } from "../../../game-runtime/orb/orb-globe-3d-runtime.js?v=20260430a";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "../../../game-runtime/orb/orb-lifecycle-3d-default.js?v=20260430a";
import { createOrbLifecycle3dRuntime } from "../../../game-runtime/orb/orb-lifecycle-3d-runtime.js?v=20260430a";
import {
  EVT_ORB_DAMAGE_APPLIED,
  EVT_ORB_DIED,
  EVT_ORB_HEALED,
  EVT_ORB_REVIVED,
  EVT_PICKUP_COLLECTED,
  EVT_RESOURCES_GLOBE_INVENTORY_CHANGED,
  EVT_RESOURCES_GLOBE_SPENT,
  EVT_VOICE_SPELL_CAST,
  EVT_VOICE_SPELL_LOADED,
} from "../../../contracts/events.js";

const BO_WORLD_UNITS = LEVEL_DEPTH_DEFAULT_BO_WORLD_UNITS;
const PREVIEW_RASTER_SIZE = 384;
const DEPTH_LAYER_ALPHA_THRESHOLD = 8;
const DEPTH_CAMERA_FOV_DEG = LEVEL_DEPTH_CAMERA_FOV_DEG;
const DEPTH_ENVIRONMENT_MODE = Object.freeze({
  runtime: "runtime",
  debug: "debug",
});
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
function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, clampNumber(value, 0)));
}

function readSpawnWorldX(spawn = {}, worldWidthPx = 1) {
  if (Number.isFinite(Number(spawn && spawn.xW))) return Number(spawn.xW);
  if (spawn && spawn.worldCenter && Number.isFinite(Number(spawn.worldCenter.xW))) {
    return Number(spawn.worldCenter.xW);
  }
  return Math.max(1, clampNumber(worldWidthPx, 1)) * clamp01(spawn && spawn.xNorm);
}

function readSpawnWorldY(spawn = {}) {
  if (Number.isFinite(Number(spawn && spawn.yW))) return Number(spawn.yW);
  if (spawn && spawn.worldCenter && Number.isFinite(Number(spawn.worldCenter.yW))) {
    return Number(spawn.worldCenter.yW);
  }
  return 0;
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

function resolvePropAnchorPoint(prop = {}) {
  return prop && prop.worldAnchor
    ? prop.worldAnchor
    : (prop && prop.worldCenter ? prop.worldCenter : Object.freeze({ xW: 0, yW: 0 }));
}

function resolvePlinthYForAnchor(anchorY = 0, anchor = "center", metrics = {}) {
  const normalizedAnchor = String(anchor || "center").trim().toLowerCase();
  if (normalizedAnchor === "top") {
    return anchorY - clampNumber(metrics && metrics.plinthHeight, 0);
  }
  if (normalizedAnchor === "bottom" || normalizedAnchor === "base") {
    return anchorY;
  }
  return anchorY - clampNumber(metrics && metrics.columnCenterY, 0);
}

function resolveActorLanePropZ(zBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO, bo = BO_WORLD_UNITS, metrics = {}) {
  const authoredDepth = Math.max(0, clampNumber(zBO, LEVEL_DEPTH_DEFAULT_ORB_Z_BO)) * Math.max(1, clampNumber(bo, BO_WORLD_UNITS));
  const propHalfDepth = Math.max(
    clampNumber(metrics && metrics.baseDepth, 0),
    clampNumber(metrics && metrics.capitalDepth, 0),
    clampNumber(metrics && metrics.columnDepth, 0)
  ) * 0.5;
  return -(authoredDepth + propHalfDepth + (Math.max(1, clampNumber(bo, BO_WORLD_UNITS)) * 0.05));
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

export function createLevelStageDepth3dLayer({
  root = null,
  labelEl = null,
  debugEl = null,
  orbDiameterWorldUnits = BO_WORLD_UNITS,
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
  scene.add(new THREE.AmbientLight(0xffffff, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.25 : 0.018));
  const fill = new THREE.HemisphereLight(0xbfdfff, 0x050507, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 0.0 : 0.055);
  scene.add(fill);
  const key = new THREE.DirectionalLight(0xdfeeff, environmentMode === DEPTH_ENVIRONMENT_MODE.debug ? 1.15 : 0.0);
  key.position.set(-0.3, -0.5, 1.0);
  key.castShadow = false;
  scene.add(key);
  const group = new THREE.Group();
  const propsGroup = new THREE.Group();
  const actorGroup = new THREE.Group();
  scene.add(group);
  scene.add(propsGroup);
  scene.add(actorGroup);

  let disposed = false;
  let worldWidthPx = 1;
  let worldHeightPx = 1;
  let depthLayerCount = 0;
  let lastFrame = null;
  let pendingRenderFrame = 0;
  let lastRenderWidth = 0;
  let lastRenderHeight = 0;
  let hasCameraFrame = false;
  let lastCameraAspect = 0;
  let lastCameraNear = 0;
  let lastCameraFar = 0;
  let lastCameraX = 0;
  let lastCameraY = 0;
  let lastCameraZ = 0;
  let propEdgeMaterials = [];
  const globe3dGroup = new THREE.Group();
  globe3dGroup.name = "globe3d:runtime_layer";
  actorGroup.add(globe3dGroup);
  const baseOrbWorldUnits = Math.max(1, clampNumber(orbDiameterWorldUnits, BO_WORLD_UNITS));
  let currentOrbZBO = LEVEL_DEPTH_DEFAULT_ORB_Z_BO;
  let globe3dFrame = 0;
  let lastGlobe3dTickMs = 0;
  const orb3dActorRuntime = createOrb3dActorRuntime({
    parent: actorGroup,
    fallbackBo: baseOrbWorldUnits,
    getDefaultZBO: () => currentOrbZBO,
    toRuntimePosition: ({ x = 0, y = 0, z = 0 } = {}) => ({
      x: toThreeX(x, worldWidthPx),
      y: toThreeY(y, worldHeightPx),
      z,
    }),
    applyMeshFlags: applyEnvironmentMeshFlags,
    onTelemetry: updateOrbTelemetry,
    onModelChanged: () => {
      orbLifecycle3dRuntime.attachOrbModel();
    },
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const worldGlobe3dRuntime = createWorldGlobe3dRuntime({
    group: globe3dGroup,
    createGlobeObject: createGlobe3dObject,
    resolveSpawnAnchor: (spawn) => ({
      x: readSpawnWorldX(spawn, worldWidthPx),
      y: readSpawnWorldY(spawn),
    }),
    toRuntimePosition: ({ x = 0, y = 0 } = {}) => ({
      x: toThreeX(x, worldWidthPx),
      y: toThreeY(y, worldHeightPx),
      z: -orb3dActorRuntime.getDepthPx(),
    }),
    getBo: () => baseOrbWorldUnits,
    getConfig: () => WORLD_GLOBE_3D_VISUAL_DEFAULTS,
    onSpawnCountChange: (count) => {
      root.dataset.depthGlobe3dWorldSpawnCount = String(Math.max(0, Number(count) || 0));
    },
    onActiveCountChange: (count) => {
      root.dataset.depthGlobe3dWorldCount = String(Math.max(0, Number(count) || 0));
    },
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const orbGlobe3dRuntime = createOrbGlobe3dRuntime({
    group: globe3dGroup,
    createGlobeObject: createGlobe3dObject,
    getBo: () => baseOrbWorldUnits,
    getCenterPosition: () => orb3dActorRuntime.getPosition(),
    getConfig: () => ORB_GLOBE_3D_VISUAL_DEFAULTS,
    onCountChange: (count) => {
      root.dataset.depthGlobe3dOrbCount = String(Math.max(0, Number(count) || 0));
    },
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const orbLifecycle3dRuntime = createOrbLifecycle3dRuntime({
    getOrbModel: () => orb3dActorRuntime.getModel(),
    getBurstParent: () => actorGroup,
    getBo: () => orb3dActorRuntime.getBo(),
    getConfig: () => ORB_LIFECYCLE_3D_DEFAULTS,
    getBurstPosition: () => orb3dActorRuntime.getPosition(),
    onNeedsFrame: () => scheduleGlobe3dFrames(),
  });
  const globe3dUnsub = [];
  let lastTelemetryText = "";
  let lastTelemetryBO = "";
  let lastTelemetryRadius = "";
  let lastTelemetryZBO = "";
  let lastTelemetryDepthPx = "";

  function updateOrbTelemetry({
    bo = orb3dActorRuntime.getBo(),
    zBO = currentOrbZBO,
    depthPx = orb3dActorRuntime.getDepthPx(),
  } = {}) {
    if (!root || !root.dataset) return;
    const nextBO = Number(bo || 0).toFixed(2);
    const nextRadius = (Math.max(1, Number(bo) || BO_WORLD_UNITS) * 0.5).toFixed(2);
    const nextZBO = Number(zBO || 0).toFixed(2);
    const nextDepthPx = Number(depthPx || 0).toFixed(2);
    if (
      nextBO === lastTelemetryBO
      && nextRadius === lastTelemetryRadius
      && nextZBO === lastTelemetryZBO
      && nextDepthPx === lastTelemetryDepthPx
    ) {
      return;
    }
    lastTelemetryBO = nextBO;
    lastTelemetryRadius = nextRadius;
    lastTelemetryZBO = nextZBO;
    lastTelemetryDepthPx = nextDepthPx;
    root.dataset.depthOrbBo = nextBO;
    root.dataset.depthOrbRadius = nextRadius;
    root.dataset.depthOrbZbo = nextZBO;
    root.dataset.depthOrbDepthPx = nextDepthPx;
    if (labelEl && labelEl.dataset) {
      labelEl.dataset.depthOrbBo = nextBO;
      labelEl.dataset.depthOrbRadius = nextRadius;
      labelEl.dataset.depthOrbZbo = nextZBO;
      labelEl.dataset.depthOrbDepthPx = nextDepthPx;
    }
    if (debugEl) {
      const nextText = `3d BO ${nextBO} | r ${nextRadius} | z ${nextZBO}BO | depth ${nextDepthPx}`;
      if (nextText !== lastTelemetryText) {
        debugEl.textContent = nextText;
        lastTelemetryText = nextText;
      }
    }
  }

  function setLabel(text) {
    if (labelEl) {
      labelEl.dataset.depth3d = text;
    }
  }

  function clearGroup() {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeThreeObject(child);
    }
  }

  function clearPropsGroup() {
    while (propsGroup.children.length) {
      const child = propsGroup.children[0];
      propsGroup.remove(child);
      disposeThreeObject(child);
    }
    propEdgeMaterials = [];
  }

  function clearGlobe3dObjects() {
    worldGlobe3dRuntime.dispose();
    orbGlobe3dRuntime.dispose();
    while (globe3dGroup.children.length) {
      const child = globe3dGroup.children[0];
      globe3dGroup.remove(child);
      disposeThreeObject(child);
    }
    orbLifecycle3dRuntime.dispose();
  }

  function createGlobe3dObject({
    bo = baseOrbWorldUnits * 0.18,
    materialConfig = WORLD_GLOBE_3D_VISUAL_DEFAULTS.material,
    name = "globe3d:runtime",
  } = {}) {
    const material = createGlobeMaterial(materialConfig);
    const { model } = createGlobe3dModel({
      bo: Math.max(1, bo),
      material,
      shellSegments: 32,
    });
    model.name = name;
    const light = createGlobePointLight({
      bo: Math.max(1, bo),
      config: materialConfig,
    });
    light.name = `${name}:light`;
    model.add(light);
    applyEnvironmentMeshFlags(model, {
      receiveShadow: false,
      castShadow: false,
    });
    return model;
  }

  function loadGlobe3dWorldSpawns(spawns = []) {
    clearGlobe3dObjects();
    worldGlobe3dRuntime.loadSpawns(spawns);
    syncRootVisibility();
    scheduleGlobe3dFrames();
  }

  function bindGlobe3dEvents({ eventBus = null, spawns = [] } = {}) {
    root.dataset.depthGlobe3dBound = eventBus && typeof eventBus.on === "function" ? "true" : "false";
    while (globe3dUnsub.length) {
      const off = globe3dUnsub.pop();
      try { off(); } catch (_) {}
    }
    loadGlobe3dWorldSpawns(spawns);
    if (!eventBus || typeof eventBus.on !== "function") return;
    globe3dUnsub.push(eventBus.on(EVT_PICKUP_COLLECTED, (payload = {}) => {
      worldGlobe3dRuntime.collect(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_RESOURCES_GLOBE_SPENT, (payload = {}) => {
      worldGlobe3dRuntime.markSpent(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_RESOURCES_GLOBE_INVENTORY_CHANGED, (payload = {}) => {
      orbGlobe3dRuntime.reconcileInventory(payload.globes || []);
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_DAMAGE_APPLIED, (payload = {}) => {
      orbLifecycle3dRuntime.applyDamage(payload);
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_HEALED, (payload = {}) => {
      orbLifecycle3dRuntime.heal(payload);
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_VOICE_SPELL_LOADED, (payload = {}) => {
      orbGlobe3dRuntime.load(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_VOICE_SPELL_CAST, (payload = {}) => {
      orbGlobe3dRuntime.consume(payload);
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_DIED, () => {
      orbGlobe3dRuntime.setDead(true);
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_DIED, (payload = {}) => {
      orbLifecycle3dRuntime.startDissolve(payload);
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_REVIVED, () => {
      orbGlobe3dRuntime.revive();
      scheduleGlobe3dFrames();
    }));
    globe3dUnsub.push(eventBus.on(EVT_ORB_REVIVED, (payload = {}) => {
      orbLifecycle3dRuntime.reset(payload);
      scheduleGlobe3dFrames();
    }));
  }

  function tickGlobe3dRuntime(nowMs = performance.now()) {
    const timeSec = nowMs / 1000;
    const dtSec = lastGlobe3dTickMs ? Math.max(0.001, Math.min(0.05, (nowMs - lastGlobe3dTickMs) / 1000)) : 0.016;
    lastGlobe3dTickMs = nowMs;
    worldGlobe3dRuntime.update(timeSec);
    orbGlobe3dRuntime.update({ timeSec, dtSec });
    orbLifecycle3dRuntime.update(nowMs);
  }

  function hasActiveGlobe3dAnimation() {
    return (
      worldGlobe3dRuntime.hasActiveVisuals()
      || orbGlobe3dRuntime.hasActiveVisuals()
      || orbLifecycle3dRuntime.hasActiveVisuals()
      || orb3dActorRuntime.isNodActive()
    );
  }

  function scheduleGlobe3dFrames() {
    if (disposed || globe3dFrame || typeof requestAnimationFrame !== "function") return;
    const tick = (nowMs) => {
      globe3dFrame = 0;
      if (disposed || !hasActiveGlobe3dAnimation()) return;
      tickGlobe3dRuntime(nowMs);
      renderFrame(lastFrame || {});
      globe3dFrame = requestAnimationFrame(tick);
    };
    globe3dFrame = requestAnimationFrame(tick);
  }

  function syncRootVisibility() {
    root.hidden = depthLayerCount <= 0
      && propsGroup.children.length <= 0
      && !orb3dActorRuntime.hasModel()
      && !globe3dGroup.children.length;
  }

  function doRenderFrame({
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
    if (width !== lastRenderWidth || height !== lastRenderHeight) {
      renderer.setSize(width, height, false);
      propEdgeMaterials.forEach((material) => {
        if (material && material.resolution) material.resolution.set(width, height);
      });
      lastRenderWidth = width;
      lastRenderHeight = height;
    }
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
    const nextAspect = width / height;
    const nextNear = Math.max(1, cameraZ * 0.02);
    const nextFar = Math.max(24000, cameraZ + (BO_WORLD_UNITS * 32));
    const projectionChanged = !hasCameraFrame
      || Math.abs(nextAspect - lastCameraAspect) > 0.000001
      || Math.abs(nextNear - lastCameraNear) > 0.000001
      || Math.abs(nextFar - lastCameraFar) > 0.000001;
    const positionChanged = !hasCameraFrame
      || Math.abs(cx - lastCameraX) > 0.000001
      || Math.abs(cy - lastCameraY) > 0.000001
      || Math.abs(cameraZ - lastCameraZ) > 0.000001;
    if (projectionChanged) {
      camera.aspect = nextAspect;
      camera.near = nextNear;
      camera.far = nextFar;
      camera.updateProjectionMatrix();
    }
    if (positionChanged) {
      camera.position.set(cx, cy, cameraZ);
      camera.lookAt(cx, cy, 0);
    }
    hasCameraFrame = true;
    lastCameraAspect = nextAspect;
    lastCameraNear = nextNear;
    lastCameraFar = nextFar;
    lastCameraX = cx;
    lastCameraY = cy;
    lastCameraZ = cameraZ;
    orb3dActorRuntime.update(performance.now() / 1000);
    tickGlobe3dRuntime(performance.now());
    renderer.render(scene, camera);
  }

  function renderFrame(frame = {}) {
    if (disposed) return;
    lastFrame = {
      camLeft: clampNumber(frame.camLeft, 0),
      camTop: clampNumber(frame.camTop, 0),
      zoom: clampNumber(frame.zoom, 1),
      viewportWidthPx: clampNumber(frame.viewportWidthPx, 0),
      viewportHeightPx: clampNumber(frame.viewportHeightPx, 0),
      isBootFrame: !!frame.isBootFrame,
    };
    if (pendingRenderFrame) return;
    if (typeof requestAnimationFrame !== "function") {
      doRenderFrame(lastFrame);
      return;
    }
    pendingRenderFrame = requestAnimationFrame(() => {
      pendingRenderFrame = 0;
      if (disposed) return;
      doRenderFrame(lastFrame || {});
    });
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

  function buildPropModel(prop = {}) {
    const kind = String(prop && prop.kind || "").trim().toLowerCase();
    if (kind !== "plinth") return null;
    const scale = Math.max(0.01, clampNumber(prop && prop.scale, 1));
    const bo = Math.max(1, orb3dActorRuntime.getBo() * scale);
    const material = createGraphiteMaterial(GRAPHITE_CONFIG);
    const { model, metrics } = createPlinthModel({
      bo,
      material,
      decorateMesh: (mesh) => {
        addLineEdges(mesh, {
          color: GRAPHITE_CONFIG.edgeHaloColor,
          linewidth: GRAPHITE_CONFIG.edgeHaloWidth,
          opacity: GRAPHITE_CONFIG.edgeHaloOpacity,
          thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
          edgeMaterials: propEdgeMaterials,
        });
        addLineEdges(mesh, {
          color: GRAPHITE_CONFIG.edgeColor,
          linewidth: GRAPHITE_CONFIG.edgeWidth,
          opacity: GRAPHITE_CONFIG.edgeOpacity,
          thresholdAngle: GRAPHITE_CONFIG.edgeThresholdAngle,
          edgeMaterials: propEdgeMaterials,
        });
      },
    });
    const anchorPoint = resolvePropAnchorPoint(prop);
    const zBO = Math.max(0, clampNumber(prop && prop.zBO, LEVEL_DEPTH_DEFAULT_ORB_Z_BO));
    model.position.set(
      toThreeX(anchorPoint.xW, worldWidthPx),
      resolvePlinthYForAnchor(toThreeY(anchorPoint.yW, worldHeightPx), prop && prop.anchor, metrics),
      resolveActorLanePropZ(zBO, bo, metrics)
    );
    model.name = `prop:${String(prop && prop.id || kind)}`;
    model.userData.prop = prop;
    model.userData.authoredZBO = zBO;
    model.traverse((child) => {
      if (!child || !child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return model;
  }

  function loadProps(props = []) {
    clearPropsGroup();
    const propList = Array.isArray(props) ? props : [];
    for (const prop of propList) {
      const model = buildPropModel(prop);
      if (model) propsGroup.add(model);
    }
    root.dataset.depthPropCount = String(propsGroup.children.length);
  }

  return Object.freeze({
    async loadScene(authoredScene = null, state = null) {
      if (disposed) return;
      clearGroup();
      clearPropsGroup();
      const summary = authoredScene && authoredScene.summary ? authoredScene.summary : null;
      const layers = Array.isArray(summary && summary.depthLayers) ? summary.depthLayers : [];
      const props = Array.isArray(authoredScene && authoredScene.props)
        ? authoredScene.props
        : (Array.isArray(summary && summary.props) ? summary.props : []);
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
      loadProps(props);
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
      const handled = orb3dActorRuntime.setWorldPosition({ xW, yW, bo, zBO });
      if (!handled) return false;
      syncRootVisibility();
      scheduleGlobe3dFrames();
      if (lastFrame) renderFrame(lastFrame);
      return true;
    },
    bindGlobe3dRuntime(args = {}) {
      if (disposed) return;
      bindGlobe3dEvents(args);
    },
    playOrbNod3d(payload = {}) {
      if (disposed) {
        return { handled: false, skipped: "orb_nod3d_runtime_missing" };
      }
      const result = orb3dActorRuntime.playNod(payload);
      if (result && result.handled) {
        scheduleGlobe3dFrames();
        renderFrame(lastFrame || {});
      }
      return result || { handled: false };
    },
    renderFrame,
    dispose() {
      disposed = true;
      if (globe3dFrame && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(globe3dFrame);
      }
      if (pendingRenderFrame && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(pendingRenderFrame);
      }
      globe3dFrame = 0;
      pendingRenderFrame = 0;
      orbLifecycle3dRuntime.dispose();
      while (globe3dUnsub.length) {
        const off = globe3dUnsub.pop();
        try { off(); } catch (_) {}
      }
      clearGlobe3dObjects();
      orb3dActorRuntime.dispose();
      clearGroup();
      clearPropsGroup();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  });
}
