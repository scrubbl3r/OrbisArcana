import * as THREE from "three";

const BO_WORLD_UNITS = 72;
const PREVIEW_RASTER_SIZE = 384;
const DEPTH_LAYER_ALPHA_THRESHOLD = 8;
const DEPTH_OBLIQUE_X_RATIO = 0.18;
const DEPTH_OBLIQUE_Y_RATIO = -0.14;

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

function buildGraphiteMaterial({ opacity = 0.78, color = 0x33383e } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0.02,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
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

function buildVectorLoopShape(loop = {}, worldWidthPx = 1, worldHeightPx = 1, {
  offsetX = 0,
  offsetY = 0,
} = {}) {
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
  const startBase = toThreePointFromWorld(cleanPoints[0], worldWidthPx, worldHeightPx, 0);
  const start = Object.freeze({ ...startBase, x: startBase.x + offsetX, y: startBase.y + offsetY });
  const shape = new THREE.Shape();
  shape.moveTo(start.x, start.y);
  for (let i = 1; i < cleanPoints.length; i += 1) {
    const base = toThreePointFromWorld(cleanPoints[i], worldWidthPx, worldHeightPx, 0);
    const p = Object.freeze({ ...base, x: base.x + offsetX, y: base.y + offsetY });
    shape.lineTo(p.x, p.y);
  }
  shape.closePath();
  return shape;
}

function buildVectorWallGeometry(loop = {}, depthOffset = {}, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  const positions = [];
  const indices = [];
  const colors = [];
  const wallColor = new THREE.Color(0x2b3137);
  const dx = clampNumber(depthOffset && depthOffset.x, 0);
  const dy = clampNumber(depthOffset && depthOffset.y, 0);
  if (points.length < 3) return null;
  for (let i = 1; i < points.length; i += 1) {
    const aTop = toThreePointFromWorld(points[i - 1], worldWidthPx, worldHeightPx, 3);
    const bTop = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 3);
    const bBack = Object.freeze({ ...bTop, x: bTop.x + dx, y: bTop.y + dy, z: 1 });
    const aBack = Object.freeze({ ...aTop, x: aTop.x + dx, y: aTop.y + dy, z: 1 });
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

function buildVectorLoopEdges(loop = {}, depthOffset = {}, worldWidthPx = 1, worldHeightPx = 1) {
  const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
  const positions = [];
  const dx = clampNumber(depthOffset && depthOffset.x, 0);
  const dy = clampNumber(depthOffset && depthOffset.y, 0);
  if (points.length < 2) return null;
  for (let i = 1; i < points.length; i += 1) {
    const a = toThreePointFromWorld(points[i - 1], worldWidthPx, worldHeightPx, 5);
    const b = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 5);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    positions.push(a.x + dx, a.y + dy, 1, b.x + dx, b.y + dy, 1);
  }
  for (let i = 0; i < points.length; i += 1) {
    const top = toThreePointFromWorld(points[i], worldWidthPx, worldHeightPx, 4);
    positions.push(top.x, top.y, 4, top.x + dx, top.y + dy, 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function buildVectorDepthLayerMesh({ layer, worldWidthPx, worldHeightPx }) {
  const loops = Array.isArray(layer && layer.loops) ? layer.loops : [];
  const primaryLoop = loops[0] || null;
  const shape = buildVectorLoopShape(primaryLoop, worldWidthPx, worldHeightPx);
  if (!shape) return null;
  const depthPx = Math.max(0, clampNumber(layer && layer.maxDepthBO, 10)) * BO_WORLD_UNITS;
  const depthOffset = Object.freeze({
    x: depthPx * DEPTH_OBLIQUE_X_RATIO,
    y: depthPx * DEPTH_OBLIQUE_Y_RATIO,
  });
  const model = new THREE.Group();
  model.name = `depth:${String(layer && layer.id || "layer")}:vector_volume`;
  model.userData.depthLayer = layer;
  model.userData.worldWidthPx = worldWidthPx;
  model.userData.worldHeightPx = worldHeightPx;
  model.userData.depthPx = depthPx;
  model.userData.baseDepthOffset = depthOffset;
  model.userData.dynamicWallMeshes = [];
  model.userData.dynamicEdgeMeshes = [];

  const floorShape = buildVectorLoopShape(primaryLoop, worldWidthPx, worldHeightPx);
  const floorGeometry = new THREE.ShapeGeometry(floorShape || shape);
  floorGeometry.translate(0, 0, 0);
  const floorMaterial = buildGraphiteMaterial({ opacity: 0.58, color: 0x303941 });
  floorMaterial.depthWrite = false;
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.renderOrder = 1;
  floor.name = `${model.name}:floor`;
  model.userData.floorMesh = floor;
  model.add(floor);

  const ceilingGeometry = new THREE.ShapeGeometry(shape);
  ceilingGeometry.translate(0, 0, 4);
  const ceilingMaterial = buildGraphiteMaterial({ opacity: 0.08, color: 0x6a7480 });
  ceilingMaterial.depthWrite = false;
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.renderOrder = 3;
  ceiling.name = `${model.name}:ceiling`;
  model.add(ceiling);

  for (const loop of loops) {
    const wallGeometry = buildVectorWallGeometry(loop, depthOffset, worldWidthPx, worldHeightPx);
    if (wallGeometry) {
      const wallMaterial = buildGraphiteMaterial({ opacity: 0.80, color: 0x232a31 });
      wallMaterial.vertexColors = true;
      wallMaterial.needsUpdate = true;
      wallMaterial.depthWrite = false;
      const walls = new THREE.Mesh(wallGeometry, wallMaterial);
      walls.renderOrder = 2;
      walls.name = `${model.name}:walls`;
      walls.userData.loop = loop;
      model.userData.dynamicWallMeshes.push(walls);
      model.add(walls);
    }
    const edgeGeometry = buildVectorLoopEdges(loop, depthOffset, worldWidthPx, worldHeightPx);
    if (edgeGeometry) {
      const edges = new THREE.LineSegments(
        edgeGeometry,
        new THREE.LineBasicMaterial({
          color: 0x66727d,
          transparent: true,
          opacity: 0.56,
        })
      );
      edges.renderOrder = 4;
      edges.userData.loop = loop;
      model.userData.dynamicEdgeMeshes.push(edges);
      model.add(edges);
    }
  }

  return model;
}

function disposeGeometry(object = null) {
  if (object && object.geometry && typeof object.geometry.dispose === "function") {
    object.geometry.dispose();
  }
}

function applyDepthModelOffset(model = null, depthOffset = {}) {
  if (!model || !model.userData) return;
  const worldWidthPx = Math.max(1, clampNumber(model.userData.worldWidthPx, 1));
  const worldHeightPx = Math.max(1, clampNumber(model.userData.worldHeightPx, 1));
  const dx = clampNumber(depthOffset && depthOffset.x, 0);
  const dy = clampNumber(depthOffset && depthOffset.y, 0);
  const floor = model.userData.floorMesh || null;
  if (floor && floor.position) {
    floor.position.set(dx, dy, 0);
  }
  for (const walls of Array.isArray(model.userData.dynamicWallMeshes) ? model.userData.dynamicWallMeshes : []) {
    const loop = walls && walls.userData ? walls.userData.loop : null;
    const geometry = buildVectorWallGeometry(loop, depthOffset, worldWidthPx, worldHeightPx);
    if (!geometry) continue;
    disposeGeometry(walls);
    walls.geometry = geometry;
  }
  for (const edges of Array.isArray(model.userData.dynamicEdgeMeshes) ? model.userData.dynamicEdgeMeshes : []) {
    const loop = edges && edges.userData ? edges.userData.loop : null;
    const geometry = buildVectorLoopEdges(loop, depthOffset, worldWidthPx, worldHeightPx);
    if (!geometry) continue;
    disposeGeometry(edges);
    edges.geometry = geometry;
  }
  model.userData.lastDepthOffsetX = dx;
  model.userData.lastDepthOffsetY = dy;
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

async function buildDepthLayerMesh({ layer, viewBox, worldWidthPx, worldHeightPx }) {
  const vectorMesh = buildVectorDepthLayerMesh({ layer, worldWidthPx, worldHeightPx });
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
  const material = buildGraphiteMaterial({ opacity: 0.86 });
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
  const ceilingMaterial = buildGraphiteMaterial({ opacity: 0.14, color: 0x59616a });
  ceilingMaterial.depthWrite = false;
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.name = `depth:${String(layer.id || "layer")}:ceiling`;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: 0x8f98a2,
      transparent: true,
      opacity: 0.36,
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
  root.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 12000);
  camera.up.set(0, 1, 0);
  scene.add(new THREE.AmbientLight(0xaeb9c5, 0.25));
  const key = new THREE.DirectionalLight(0xdfeeff, 1.15);
  key.position.set(-0.3, -0.5, 1.0);
  scene.add(key);
  const group = new THREE.Group();
  scene.add(group);

  let disposed = false;
  let worldWidthPx = 1;
  let worldHeightPx = 1;
  let depthLayerCount = 0;
  let lastFrame = null;
  let parallaxAnchorXW = 0;
  let parallaxAnchorYW = 0;
  let parallaxRatio = 0.82;
  let hasParallaxAnchor = false;

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

  function resolveDynamicDepthOffset(centerXW = 0, centerYW = 0) {
    const primary = group.children[0] || null;
    const base = primary && primary.userData ? primary.userData.baseDepthOffset : null;
    const depthPx = Math.max(0, clampNumber(primary && primary.userData && primary.userData.depthPx, BO_WORLD_UNITS * 10));
    const baseX = Number.isFinite(Number(base && base.x)) ? Number(base.x) : depthPx * DEPTH_OBLIQUE_X_RATIO;
    const baseY = Number.isFinite(Number(base && base.y)) ? Number(base.y) : depthPx * DEPTH_OBLIQUE_Y_RATIO;
    if (!hasParallaxAnchor) {
      return Object.freeze({ x: baseX, y: baseY });
    }
    const parallaxXW = (clampNumber(centerXW, 0) - parallaxAnchorXW) * (1 - parallaxRatio);
    const parallaxYW = (clampNumber(centerYW, 0) - parallaxAnchorYW) * (1 - parallaxRatio);
    return Object.freeze({
      x: baseX + parallaxXW,
      y: baseY - parallaxYW,
    });
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
    if (!hasParallaxAnchor && !isBootFrame) {
      parallaxAnchorXW = centerXW;
      parallaxAnchorYW = centerYW;
      hasParallaxAnchor = true;
    }
    const depthOffset = resolveDynamicDepthOffset(centerXW, centerYW);
    for (const child of group.children) {
      applyDepthModelOffset(child, depthOffset);
    }
    const cx = toThreeX(centerXW, worldWidthPx);
    const cy = toThreeY(centerYW, worldHeightPx);
    camera.left = -viewW * 0.5;
    camera.right = viewW * 0.5;
    camera.top = viewH * 0.5;
    camera.bottom = -viewH * 0.5;
    camera.position.set(cx, cy, 1800);
    camera.lookAt(cx, cy, 0);
    camera.updateProjectionMatrix();
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
      hasParallaxAnchor = false;
      parallaxAnchorXW = 0;
      parallaxAnchorYW = 0;
      const primaryLayer = layers[0] || null;
      const depthBO = Math.max(0, clampNumber(primaryLayer && primaryLayer.orbZBO, 4));
      const maxDepthBO = Math.max(1, clampNumber(primaryLayer && primaryLayer.maxDepthBO, 10));
      parallaxRatio = Math.max(0.55, Math.min(0.95, 1 - ((depthBO / maxDepthBO) * 0.35)));
      setLabel(resolveDepthLayerLabel(layers));
      for (const layer of layers) {
        const mesh = await buildDepthLayerMesh({
          layer,
          viewBox: summary.viewBox || { x: 0, y: 0, width: worldWidthPx, height: worldHeightPx },
          worldWidthPx,
          worldHeightPx,
        });
        if (mesh) group.add(mesh);
      }
      root.hidden = depthLayerCount <= 0;
      root.dataset.depthLayerCount = String(group.children.length);
      root.dataset.depthStatus = group.children.length ? "ready" : "empty";
      if (group.children.length) {
        renderFrame(lastFrame || { ...resolveBootFrame(layers), isBootFrame: true });
      }
    },
    renderFrame,
    dispose() {
      disposed = true;
      clearGroup();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  });
}
