import * as THREE from "three";
import { LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS } from "./depth-projection.js";
import {
  toDepthThreeX,
  toDepthThreeY,
} from "./depth-runtime-coordinates.js";
import { resolveAuthoredRenderOrder } from "./authored-render-stack.js";
import { createGraphiteMaterial } from "../rendering/three/materials/graphite-material.js";
import { GRAPHITE_CONFIG } from "../rendering/three/materials/graphite-config.js";

const PREVIEW_RASTER_SIZE = 384;
const DEPTH_LAYER_ALPHA_THRESHOLD = 8;
const DEPTH_LAYER_CHANNEL_THRESHOLD = 8;

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

function resolveDepthSampleFromRgba(r = 0, g = 0, b = 0, a = 0) {
  const alpha = clampNumber(a, 0) / 255;
  const blue = clampNumber(b, 0) / 255;
  const active = a > DEPTH_LAYER_ALPHA_THRESHOLD && b > DEPTH_LAYER_CHANNEL_THRESHOLD;
  return Object.freeze({
    alpha: active ? alpha : 0,
    depth: active ? clamp01(blue) : 0,
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
      const index = ((y * width) + x) * 4;
      const sample = resolveDepthSampleFromRgba(data[index], data[index + 1], data[index + 2], data[index + 3]);
      if (sample.alpha <= 0.03) continue;
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
  return resolveDepthSampleFromRgba(data[index], data[index + 1], data[index + 2], data[index + 3]);
}

function parseHexColorChannels(hex = "") {
  const raw = String(hex || "").trim().toLowerCase().replace(/^#/, "");
  if (raw.length === 3 || raw.length === 4) {
    return Object.freeze({
      r: Number.parseInt(raw[0] + raw[0], 16),
      g: Number.parseInt(raw[1] + raw[1], 16),
      b: Number.parseInt(raw[2] + raw[2], 16),
    });
  }
  if (raw.length === 6 || raw.length === 8) {
    return Object.freeze({
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    });
  }
  return null;
}

function isRedBlueChannelColor(color = null) {
  if (!color) return false;
  const r = clampNumber(color.r, 0);
  const g = clampNumber(color.g, 0);
  const b = clampNumber(color.b, 0);
  return (r > DEPTH_LAYER_CHANNEL_THRESHOLD || b > DEPTH_LAYER_CHANNEL_THRESHOLD)
    && (Math.abs(r - g) > DEPTH_LAYER_CHANNEL_THRESHOLD || Math.abs(b - g) > DEPTH_LAYER_CHANNEL_THRESHOLD);
}

function readDepthLayerFillColors(layer = {}) {
  const body = String(layer && layer.authoredBody || "").toLowerCase();
  const fillMatches = body.matchAll(/fill\s*(?::|=)\s*["']?(#[0-9a-f]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\))/g);
  const colors = [];
  for (const match of fillMatches) {
    const raw = String(match && match[1] || "").trim();
    const hexColor = raw.startsWith("#") ? parseHexColorChannels(raw) : null;
    if (hexColor) {
      colors.push(hexColor);
      continue;
    }
    const rgbMatch = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      colors.push(Object.freeze({
        r: Number(rgbMatch[1]),
        g: Number(rgbMatch[2]),
        b: Number(rgbMatch[3]),
      }));
    }
  }
  return Object.freeze(colors);
}

function usesChannelDepthEncoding(layer = {}) {
  return readDepthLayerFillColors(layer).some((color) => isRedBlueChannelColor(color));
}

function resolveUniformBlueDepthScale(layer = {}) {
  const colors = readDepthLayerFillColors(layer)
    .filter((color) => isRedBlueChannelColor(color));
  if (!colors.length) return null;
  const blueColors = colors.filter((color) => (
    clampNumber(color.b, 0) > DEPTH_LAYER_CHANNEL_THRESHOLD
    && clampNumber(color.r, 0) <= DEPTH_LAYER_CHANNEL_THRESHOLD
  ));
  if (blueColors.length !== colors.length) return null;
  const firstBlue = Math.round(clampNumber(blueColors[0] && blueColors[0].b, 0));
  const hasSingleDepth = blueColors.every((color) => (
    Math.round(clampNumber(color.b, 0)) === firstBlue
  ));
  return hasSingleDepth ? clamp01(firstBlue / 255) : null;
}

function resolveVectorBlueDepthScale(layer = {}) {
  const loops = Array.isArray(layer && layer.loops) ? layer.loops : [];
  const blueScales = loops
    .map((loop) => Number(loop && loop.channelDepthScale))
    .filter((scale) => Number.isFinite(scale) && scale > 0);
  if (!blueScales.length) return resolveUniformBlueDepthScale(layer);
  const firstScale = blueScales[0];
  return blueScales.every((scale) => Math.abs(scale - firstScale) < 0.001)
    ? clamp01(firstScale)
    : null;
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

  const material = createGraphiteMaterial(GRAPHITE_CONFIG);
  material.transparent = false;
  material.opacity = 1;
  material.depthWrite = true;
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

function buildVectorLoopPath(loop = {}, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  if (points.length < 3) return null;
  const start = toThreePointFromWorld(points[0], worldWidthPx, worldHeightPx, 0);
  const path = new THREE.Path();
  path.moveTo(start.x, start.y);
  for (let i = 1; i < points.length; i += 1) {
    const p = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 0);
    path.lineTo(p.x, p.y);
  }
  path.closePath();
  return path;
}

function buildVectorWallGeometry(loop = {}, depthPx = 0, worldWidthPx = 1, worldHeightPx = 1) {
  return buildVectorWallGeometryBetween(loop, 0, -depthPx, worldWidthPx, worldHeightPx);
}

function buildVectorWallGeometryBetween(loop = {}, frontZ = 0, backZ = 0, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  const positions = [];
  const indices = [];
  const colors = [];
  const wallColor = new THREE.Color(0x2b3137);
  if (points.length < 3) return null;
  for (let i = 1; i < points.length; i += 1) {
    const aTop = toThreePointFromWorld(points[i - 1], worldWidthPx, worldHeightPx, frontZ);
    const bTop = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, frontZ);
    const bBack = Object.freeze({ ...bTop, z: backZ });
    const aBack = Object.freeze({ ...aTop, z: backZ });
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

function resolveBoWorldUnits(boWorldUnits = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS) {
  return Math.max(1, clampNumber(boWorldUnits, LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS));
}

function buildVectorDepthLayerMesh({
  layer,
  worldWidthPx,
  worldHeightPx,
  environmentMode = DEPTH_ENVIRONMENT_MODE.runtime,
  boWorldUnits = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS,
}) {
  const loops = Array.isArray(layer && layer.loops) ? layer.loops : [];
  const redOperations = Array.isArray(layer && layer.redOperations) ? layer.redOperations : [];
  const primaryLoop = loops[0] || null;
  const shape = buildVectorLoopShape(primaryLoop, worldWidthPx, worldHeightPx);
  if (!shape) return null;
  const depthPx = Math.max(0, clampNumber(layer && layer.maxDepthBO, 10)) * resolveBoWorldUnits(boWorldUnits);
  const sourceMaxDepthPx = Math.max(0, clampNumber(layer && layer.sourceMaxDepthBO, layer && layer.maxDepthBO || 10)) * resolveBoWorldUnits(boWorldUnits);
  const backWallHoles = redOperations.filter((operation) => {
    const targetDepthPx = Math.max(0, clampNumber(operation && operation.targetDepthScale, 0)) * sourceMaxDepthPx;
    return targetDepthPx + 0.001 >= depthPx;
  });
  const model = new THREE.Group();
  model.name = `depth:${String(layer && layer.id || "layer")}:vector_volume`;
  model.userData.depthLayer = layer;
  model.userData.worldWidthPx = worldWidthPx;
  model.userData.worldHeightPx = worldHeightPx;
  model.userData.depthPx = depthPx;
  const baseRenderOrder = resolveAuthoredRenderOrder(layer, { fallback: 1 });

  const floorShape = buildVectorLoopShape(primaryLoop, worldWidthPx, worldHeightPx);
  for (const operation of backWallHoles) {
    const hole = buildVectorLoopPath(operation, worldWidthPx, worldHeightPx);
    if (hole && floorShape) floorShape.holes.push(hole);
  }
  const floorGeometry = new THREE.ShapeGeometry(floorShape || shape);
  floorGeometry.translate(0, 0, -depthPx);
  const floorMaterial = buildGraphiteMaterial({ opacity: 0.58, color: 0x303941, environmentMode });
  if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) floorMaterial.depthWrite = false;
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.renderOrder = baseRenderOrder;
  floor.name = `${model.name}:floor`;
  model.userData.floorMesh = floor;
  model.add(floor);

  for (const loop of loops) {
    const wallGeometry = buildVectorWallGeometry(loop, depthPx, worldWidthPx, worldHeightPx);
    if (wallGeometry) {
      const wallMaterial = buildGraphiteMaterial({ opacity: 0.80, color: 0x232a31, environmentMode });
      if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) wallMaterial.depthWrite = false;
      const walls = new THREE.Mesh(wallGeometry, wallMaterial);
      walls.renderOrder = baseRenderOrder + 0.1;
      walls.name = `${model.name}:walls`;
      walls.userData.loop = loop;
      model.add(walls);
    }
    const edgeGeometry = environmentMode === DEPTH_ENVIRONMENT_MODE.debug
      ? buildVectorLoopEdges(loop, depthPx, worldWidthPx, worldHeightPx)
      : null;
    if (edgeGeometry) {
      const edges = new THREE.LineSegments(
        edgeGeometry,
        new THREE.LineBasicMaterial({
          color: 0x66727d,
          transparent: true,
          opacity: 0.56,
          depthTest: true,
          depthWrite: false,
        })
      );
      edges.renderOrder = baseRenderOrder + 0.2;
      edges.userData.loop = loop;
      model.add(edges);
    }
  }

  for (const operation of redOperations) {
    const targetDepthPx = Math.max(0, clampNumber(operation && operation.targetDepthScale, 0)) * sourceMaxDepthPx;
    if (targetDepthPx <= depthPx + 0.001) continue;
    const revealGeometry = buildVectorWallGeometryBetween(operation, -depthPx, -targetDepthPx, worldWidthPx, worldHeightPx);
    if (!revealGeometry) continue;
    const revealMaterial = buildGraphiteMaterial({ opacity: 0.78, color: 0x20272e, environmentMode });
    if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) revealMaterial.depthWrite = false;
    const reveal = new THREE.Mesh(revealGeometry, revealMaterial);
    reveal.renderOrder = baseRenderOrder + 0.15;
    reveal.name = `${model.name}:red_reveal`;
    reveal.userData.operation = operation;
    model.add(reveal);
  }

  return model;
}

function buildDepthGeometryFromSamples({
  samples,
  cols,
  rows,
  layer,
  viewBox,
  rasterBox,
  rasterSize,
  worldWidthPx,
  worldHeightPx,
  boWorldUnits = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS,
}) {
  const positions = [];
  const indices = [];
  const colors = [];
  const depthBO = Math.max(0, clampNumber(layer.maxDepthBO, 10));
  const maxDepth = depthBO * resolveBoWorldUnits(boWorldUnits);
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

export async function buildDepthLayerMesh({
  layer,
  viewBox,
  worldWidthPx,
  worldHeightPx,
  environmentMode = DEPTH_ENVIRONMENT_MODE.runtime,
  boWorldUnits = LEVEL_DEPTH_FALLBACK_BO_WORLD_UNITS,
}) {
  const redOperations = Array.isArray(layer && layer.redOperations) ? layer.redOperations : [];
  const vectorBlueDepthScale = resolveVectorBlueDepthScale(layer);
  if (!usesChannelDepthEncoding(layer) || vectorBlueDepthScale != null || redOperations.length) {
    const resolvedBlueDepthScale = vectorBlueDepthScale == null ? 1 : vectorBlueDepthScale;
    const vectorLayer = vectorBlueDepthScale == null
      ? layer
      : Object.freeze({
          ...layer,
          sourceMaxDepthBO: Math.max(0, clampNumber(layer && layer.maxDepthBO, 10)),
          maxDepthBO: Math.max(0, clampNumber(layer && layer.maxDepthBO, 10)) * resolvedBlueDepthScale,
        });
    const vectorMesh = buildVectorDepthLayerMesh({ layer: vectorLayer, worldWidthPx, worldHeightPx, environmentMode, boWorldUnits });
    if (vectorMesh) return vectorMesh;
  }

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
    boWorldUnits,
  });
  const material = buildGraphiteMaterial({ opacity: 0.86, environmentMode });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `depth:${String(layer.id || "layer")}`;
  const baseRenderOrder = resolveAuthoredRenderOrder(layer, { fallback: 1 });
  mesh.renderOrder = baseRenderOrder;
  const model = new THREE.Group();
  model.name = `depth:${String(layer.id || "layer")}:sealed_volume`;
  model.renderOrder = baseRenderOrder;
  model.add(mesh);
  if (environmentMode === DEPTH_ENVIRONMENT_MODE.debug) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 18),
      new THREE.LineBasicMaterial({
        color: 0x8f98a2,
        transparent: true,
        opacity: 0.36,
        depthTest: true,
        depthWrite: false,
      })
    );
    edges.renderOrder = baseRenderOrder + 0.2;
    model.add(edges);
  }
  return model;
}
