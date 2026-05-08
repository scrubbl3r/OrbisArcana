import * as THREE from "three";
import { disposeThreeObject } from "../rendering/three/three-object-utils.js";

function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseColor(value = "#ffffff", fallback = 0xffffff) {
  const color = new THREE.Color(fallback);
  try {
    color.set(String(value || "#ffffff"));
  } catch (_) {
    color.set(fallback);
  }
  return color;
}

function vectorPointsFromWorldPoints(points = [], toRuntimePosition = ({ xW = 0, yW = 0 } = {}) => ({ x: xW, y: -yW })) {
  const safePoints = Array.isArray(points) ? points : [];
  const vectors = [];
  for (const point of safePoints) {
    const runtimePoint = toRuntimePosition(point || {}) || {};
    const vector = new THREE.Vector2(
      clampNumber(runtimePoint.x, 0),
      clampNumber(runtimePoint.y, 0)
    );
    const previous = vectors[vectors.length - 1];
    if (previous && Math.abs(previous.x - vector.x) < 0.001 && Math.abs(previous.y - vector.y) < 0.001) continue;
    vectors.push(vector);
  }
  if (vectors.length > 1) {
    const first = vectors[0];
    const last = vectors[vectors.length - 1];
    if (Math.abs(first.x - last.x) < 0.001 && Math.abs(first.y - last.y) < 0.001) {
      vectors.pop();
    }
  }
  return vectors.length >= 3 ? vectors : null;
}

function signedArea(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  let area = 0;
  for (let i = 0, j = safePoints.length - 1; i < safePoints.length; j = i, i += 1) {
    const a = safePoints[j] || {};
    const b = safePoints[i] || {};
    area += (clampNumber(a.x, 0) * clampNumber(b.y, 0)) - (clampNumber(b.x, 0) * clampNumber(a.y, 0));
  }
  return area * 0.5;
}

function resolveContoursFromArtShape(shape = {}, toRuntimePosition) {
  const subpaths = Array.isArray(shape && shape.worldSubpaths) && shape.worldSubpaths.length
    ? shape.worldSubpaths
    : [Array.isArray(shape && shape.worldPoints) ? shape.worldPoints : []];
  return subpaths
    .map((subpath) => vectorPointsFromWorldPoints(subpath, toRuntimePosition))
    .filter(Boolean)
    .map((points) => Object.freeze({
      points,
      area: signedArea(points),
    }))
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
}

function buildGeometryFromContours(contours = []) {
  if (!contours.length) return null;
  const outer = contours[0];
  const outerPoints = outer.area < 0 ? outer.points.slice().reverse() : outer.points.slice();
  const outerSign = Math.sign(signedArea(outerPoints)) || 1;
  const shape = new THREE.Shape(outerPoints);
  for (let i = 1; i < contours.length; i += 1) {
    const contour = contours[i];
    const holePoints = (Math.sign(contour.area) || 1) === outerSign
      ? contour.points.slice().reverse()
      : contour.points.slice();
    shape.holes.push(new THREE.Path(holePoints));
  }
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.computeVertexNormals();
  return geometry;
}

function resolveContourBounds(contours = []) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const contour of contours) {
    for (const point of Array.isArray(contour && contour.points) ? contour.points : []) {
      const x = clampNumber(point && point.x, 0);
      const y = clampNumber(point && point.y, 0);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
  const width = Math.max(0.001, maxX - minX);
  const height = Math.max(0.001, maxY - minY);
  return Object.freeze({
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + (width * 0.5),
    centerY: minY + (height * 0.5),
  });
}

function resolveCentroid(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  if (!safePoints.length) return Object.freeze({ x: 0, y: 0 });
  let x = 0;
  let y = 0;
  for (const point of safePoints) {
    x += clampNumber(point && point.x, 0);
    y += clampNumber(point && point.y, 0);
  }
  return Object.freeze({
    x: x / safePoints.length,
    y: y / safePoints.length,
  });
}

function buildMatteTextureFromContours({
  contours = [],
  fill = "#ffffff",
  fillOpacity = 1,
  stroke = "none",
  strokeOpacity = 1,
  strokeWidth = 0,
} = {}) {
  if (!globalThis.document || typeof globalThis.document.createElement !== "function") return null;
  const bounds = resolveContourBounds(contours);
  if (!bounds) return null;
  const maxTextureSize = 2048;
  const longestSide = Math.max(bounds.width, bounds.height, 1);
  const scale = Math.max(0.01, maxTextureSize / longestSide);
  const width = Math.max(2, Math.min(maxTextureSize, Math.ceil(bounds.width * scale)));
  const height = Math.max(2, Math.min(maxTextureSize, Math.ceil(bounds.height * scale)));
  const canvas = globalThis.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const toCanvasX = (x) => ((clampNumber(x, 0) - bounds.minX) / bounds.width) * width;
  const toCanvasY = (y) => ((bounds.maxY - clampNumber(y, 0)) / bounds.height) * height;
  const sampleAlphaAt = ({ x = 0, y = 0 } = {}) => {
    const sampleX = Math.max(0, Math.min(width - 1, Math.round(toCanvasX(x))));
    const sampleY = Math.max(0, Math.min(height - 1, Math.round(toCanvasY(y))));
    return ctx.getImageData(sampleX, sampleY, 1, 1).data[3] || 0;
  };

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  for (const contour of contours) {
    const points = Array.isArray(contour && contour.points) ? contour.points : [];
    if (points.length < 3) continue;
    ctx.moveTo(toCanvasX(points[0].x), toCanvasY(points[0].y));
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(toCanvasX(points[i].x), toCanvasY(points[i].y));
    }
    ctx.closePath();
  }
  ctx.fillStyle = String(fill || "#ffffff");
  ctx.globalAlpha = Math.max(0, Math.min(1, clampNumber(fillOpacity, 1)));
  ctx.fill("evenodd");
  const safeStrokeWidth = Math.max(0, clampNumber(strokeWidth, 0));
  if (String(stroke || "none").trim().toLowerCase() !== "none" && safeStrokeWidth > 0) {
    ctx.strokeStyle = String(stroke);
    ctx.globalAlpha = Math.max(0, Math.min(1, clampNumber(strokeOpacity, 1)));
    ctx.lineWidth = Math.max(1, safeStrokeWidth * scale);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const outerCentroid = resolveCentroid(contours[0] && contours[0].points);
  const firstHoleCentroid = resolveCentroid(contours[1] && contours[1].points);
  return Object.freeze({
    texture,
    bounds,
    canvasWidth: width,
    canvasHeight: height,
    outerSampleAlpha: sampleAlphaAt(outerCentroid),
    firstHoleSampleAlpha: contours.length > 1 ? sampleAlphaAt(firstHoleCentroid) : null,
  });
}

function buildArtMesh({
  shape = {},
  bo = 72,
  toRuntimePosition,
} = {}) {
  const contours = resolveContoursFromArtShape(shape, toRuntimePosition);
  const fill = String(shape && shape.fill || "none").trim();
  const fillOpacity = Math.max(0, Math.min(1, clampNumber(shape && shape.fillOpacity, 1)));
  const stroke = String(shape && shape.stroke || "none").trim();
  const strokeOpacity = Math.max(0, Math.min(1, clampNumber(shape && shape.strokeOpacity, 1)));
  const worldStrokeWidth = Math.max(0, clampNumber(shape && shape.worldStrokeWidth, 0));
  const matte = contours.length > 1
    ? buildMatteTextureFromContours({
      contours,
      fill: fill === "none" ? "#ffffff" : fill,
      fillOpacity,
      stroke,
      strokeOpacity,
      strokeWidth: worldStrokeWidth,
    })
    : null;
  const geometry = matte
    ? new THREE.PlaneGeometry(matte.bounds.width, matte.bounds.height)
    : buildGeometryFromContours(contours);
  if (!geometry) return null;
  const z = -Math.max(0, clampNumber(shape && shape.zBO, 1)) * Math.max(1, clampNumber(bo, 72));
  geometry.translate(matte ? matte.bounds.centerX : 0, matte ? matte.bounds.centerY : 0, z);
  const material = new THREE.MeshBasicMaterial({
    color: matte ? 0xffffff : parseColor(fill === "none" ? "#ffffff" : fill, 0xffffff),
    map: matte ? matte.texture : null,
    transparent: !!matte || fillOpacity < 1,
    opacity: matte ? 1 : fillOpacity,
    alphaTest: matte ? 0.01 : 0,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `art_plane:${String(shape && shape.id || "shape")}`;
  mesh.renderOrder = 10;
  mesh.userData.artShape = shape;
  mesh.userData.artPlaneTrace = Object.freeze({
    id: String(shape && shape.id || "shape"),
    mode: matte ? "texture-evenodd" : "shape-geometry",
    contourCount: contours.length,
    holeCount: Math.max(0, contours.length - 1),
    zBO: Math.max(0, clampNumber(shape && shape.zBO, 1)),
    fill,
    fillOpacity,
    hasMap: !!matte,
    transparent: !!material.transparent,
    alphaTest: clampNumber(material.alphaTest, 0),
    bounds: matte ? matte.bounds : null,
    texture: matte ? {
      width: matte.canvasWidth,
      height: matte.canvasHeight,
      outerSampleAlpha: matte.outerSampleAlpha,
      firstHoleSampleAlpha: matte.firstHoleSampleAlpha,
    } : null,
  });
  return mesh;
}

export function createArtPlane3dRuntime({
  group = null,
  getBo = () => 72,
  toRuntimePosition = ({ xW = 0, yW = 0 } = {}) => ({ x: xW, y: -yW }),
  onCountChange = () => {},
  traceMark = null,
} = {}) {
  const root = group || new THREE.Group();
  root.name = root.name || "art_plane:runtime_layer";
  let disposed = false;
  let count = 0;
  let lastTrace = Object.freeze({
    count: 0,
    shapes: [],
  });

  function publishTrace(event = "art-plane.trace") {
    lastTrace = Object.freeze({
      event,
      count,
      shapes: Object.freeze(root.children
        .map((child) => child && child.userData ? child.userData.artPlaneTrace : null)
        .filter(Boolean)),
    });
    if (typeof globalThis !== "undefined") {
      globalThis.__orbisArtPlaneTrace = lastTrace;
    }
    if (typeof traceMark === "function") {
      traceMark(event, lastTrace);
    }
  }

  function clear() {
    while (root.children.length) {
      const child = root.children[0];
      root.remove(child);
      disposeThreeObject(child);
    }
    count = 0;
    if (typeof onCountChange === "function") onCountChange(0);
    publishTrace("art-plane.clear");
  }

  function load(artShapes = []) {
    if (disposed) return;
    clear();
    const bo = Math.max(1, clampNumber(getBo(), 72));
    for (const shape of Array.isArray(artShapes) ? artShapes : []) {
      const mesh = buildArtMesh({ shape, bo, toRuntimePosition });
      if (mesh) root.add(mesh);
    }
    count = root.children.length;
    if (typeof onCountChange === "function") onCountChange(count);
    publishTrace("art-plane.load");
  }

  return Object.freeze({
    group: root,
    load,
    clear,
    dispose() {
      disposed = true;
      clear();
    },
    getTrace: () => lastTrace,
    getCount: () => count,
  });
}
