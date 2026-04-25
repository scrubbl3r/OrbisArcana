function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildLoopPathData(points = []) {
  if (!Array.isArray(points) || !points.length) return "";
  const start = points[0] || { xW: 0, yW: 0 };
  let d = `M ${clampNumber(start.xW, 0).toFixed(2)} ${clampNumber(start.yW, 0).toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i] || {};
    d += ` L ${clampNumber(point.xW, 0).toFixed(2)} ${clampNumber(point.yW, 0).toFixed(2)}`;
  }
  return d;
}

function buildClosedLoopPathData(points = []) {
  const d = buildLoopPathData(points);
  return d ? `${d} Z` : "";
}

function computePolygonCentroid(points = []) {
  const safePoints = Array.isArray(points) ? points : [];
  if (safePoints.length < 3) {
    const count = Math.max(1, safePoints.length);
    const sum = safePoints.reduce((acc, point = {}) => ({
      x: acc.x + clampNumber(point.xW, 0),
      y: acc.y + clampNumber(point.yW, 0),
    }), { x: 0, y: 0 });
    return Object.freeze({ xW: sum.x / count, yW: sum.y / count });
  }
  let areaTwice = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = safePoints.length - 1; i < safePoints.length; j = i, i += 1) {
    const pi = safePoints[i] || {};
    const pj = safePoints[j] || {};
    const xi = clampNumber(pi.xW, 0);
    const yi = clampNumber(pi.yW, 0);
    const xj = clampNumber(pj.xW, 0);
    const yj = clampNumber(pj.yW, 0);
    const cross = (xj * yi) - (xi * yj);
    areaTwice += cross;
    cx += (xj + xi) * cross;
    cy += (yj + yi) * cross;
  }
  if (Math.abs(areaTwice) < 1e-9) {
    const count = Math.max(1, safePoints.length);
    const sum = safePoints.reduce((acc, point = {}) => ({
      x: acc.x + clampNumber(point.xW, 0),
      y: acc.y + clampNumber(point.yW, 0),
    }), { x: 0, y: 0 });
    return Object.freeze({ xW: sum.x / count, yW: sum.y / count });
  }
  return Object.freeze({
    xW: cx / (3 * areaTwice),
    yW: cy / (3 * areaTwice),
  });
}

function expandPolygonFromCentroid(points = [], scale = 1) {
  const safePoints = Array.isArray(points) ? points : [];
  const centroid = computePolygonCentroid(safePoints);
  const nextScale = Math.max(0, clampNumber(scale, 1));
  return Object.freeze(safePoints.map((point = {}) => Object.freeze({
    xW: centroid.xW + ((clampNumber(point.xW, centroid.xW) - centroid.xW) * nextScale),
    yW: centroid.yW + ((clampNumber(point.yW, centroid.yW) - centroid.yW) * nextScale),
  })));
}

function formatSvgTranslate(x = 0, y = 0) {
  return `translate(${clampNumber(x, 0).toFixed(2)} ${clampNumber(y, 0).toFixed(2)})`;
}

function formatNumberAttr(value, fallback = 0) {
  return clampNumber(value, fallback).toFixed(2);
}

function resolveTravelRange(cameraMin = 0, cameraMax = 0, viewportSpan = 0, fallback = 0) {
  const min = clampNumber(cameraMin, 0);
  const max = clampNumber(cameraMax, min);
  const span = Math.max(0, clampNumber(viewportSpan, 0));
  return Object.freeze({
    min,
    max: Math.max(min, max - span),
  });
}

export function buildAuthoredLevelOverlayMarkup({
  starsField = null,
  loops = [],
  lineArtShapes = [],
  overlayId = "authoredOverlay",
  worldWidthPx = 0,
  worldHeightPx = 0,
} = {}) {
  const clipRegions = Array.isArray(starsField && starsField.regions) ? starsField.regions : [];
  const layerBoxes = Array.isArray(starsField && starsField.layers) ? starsField.layers : [];
  const starsFieldMarkup = clipRegions
    .map((region = {}, index) => {
      const pathData = buildClosedLoopPathData(region.worldPoints);
      if (!pathData) return "";
      return `<path class="authoredStarsFieldDebugOutline" data-stars-field-path="${String(region.id || `stars_field_${index + 1}`)}" d="${pathData}" style="fill:none;stroke:rgba(255,48,48,0.55);stroke-width:6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;"></path>`;
    })
    .filter(Boolean)
    .join("");
  const layerBoxMarkup = layerBoxes
    .map((layer = {}, index) => {
      const box = layer && layer.boundaryBox ? layer.boundaryBox : null;
      if (!box) return "";
      const sourceBox = layer && layer.sourceBoundaryBox ? layer.sourceBoundaryBox : box;
      const cameraBox = layer && layer.cameraBoundaryBox ? layer.cameraBoundaryBox : sourceBox;
      const x = formatNumberAttr(clampNumber(sourceBox.leftXW, 0), 0);
      const y = formatNumberAttr(clampNumber(sourceBox.topYW, 0), 0);
      const width = formatNumberAttr(Math.max(1, clampNumber(sourceBox.widthW, 1)), 1);
      const height = formatNumberAttr(Math.max(1, clampNumber(sourceBox.heightW, 1)), 1);
      const ratio = Math.max(0, Math.min(1, clampNumber(layer.parallaxRatio, 0)));
      const stroke = String(layer.stroke || ["#ff9f2f", "#38d66b", "#4aa3ff"][index] || "#ffffff");
      const layerId = String(layer.layerId || `layer_${index + 1}`);
      const patternId = `${overlayId}__stars_box_pattern__${layerId}`;
      return `<g class="authoredStarsFieldLayer authoredStarsFieldLayer--${layerId}" data-stars-band="${layerId}" data-parallax-ratio="${ratio.toFixed(3)}" data-field-left="${formatNumberAttr(sourceBox.leftXW, 0)}" data-field-top="${formatNumberAttr(sourceBox.topYW, 0)}" data-field-width="${formatNumberAttr(sourceBox.widthW, 1)}" data-field-height="${formatNumberAttr(sourceBox.heightW, 1)}" data-camera-left="${formatNumberAttr(cameraBox.leftXW, 0)}" data-camera-top="${formatNumberAttr(cameraBox.topYW, 0)}" data-camera-right="${formatNumberAttr(cameraBox.rightXW, 0)}" data-camera-bottom="${formatNumberAttr(cameraBox.bottomYW, 0)}" transform="${formatSvgTranslate(0, 0)}"><defs><pattern id="${patternId}" patternUnits="userSpaceOnUse" width="120" height="120"><path d="M 0 120 L 120 0" fill="none" stroke="${stroke}" stroke-opacity="0.18" stroke-width="10"></path><circle cx="24" cy="24" r="6" fill="${stroke}" fill-opacity="0.30"></circle><circle cx="84" cy="72" r="4" fill="${stroke}" fill-opacity="0.22"></circle></pattern></defs><rect data-stars-box-stroke="true" x="${x}" y="${y}" width="${width}" height="${height}" fill="${stroke}" fill-opacity="0.10" stroke="${stroke}" stroke-opacity="1" stroke-width="28" stroke-dasharray="44 16" stroke-linejoin="round" vector-effect="non-scaling-stroke"></rect><rect data-stars-box-pattern="true" x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${patternId})" stroke="none"></rect></g>`;
    })
    .filter(Boolean)
    .join("");

  const lineArtMarkup = (Array.isArray(lineArtShapes) ? lineArtShapes : [])
    .map((shape = {}, index) => {
      const pathData = buildLoopPathData(shape.worldPoints);
      if (!pathData) return "";
      const fill = String(shape.fill || "none").trim();
      const stroke = String(shape.stroke || "none").trim();
      const fillOpacity = Math.max(0, Math.min(1, clampNumber(shape.fillOpacity, 1)));
      const strokeOpacity = Math.max(0, Math.min(1, clampNumber(shape.strokeOpacity, 1)));
      const strokeWidth = Math.max(0, clampNumber(shape.worldStrokeWidth, 1));
      return `<path class="levelStageLineArtPath" data-line-art-id="${String(shape.id || `line_art_${index + 1}`)}" d="${pathData}" style="fill:${fill};fill-opacity:${fillOpacity};stroke:${stroke};stroke-opacity:${strokeOpacity};stroke-width:${strokeWidth};"></path>`;
    })
    .filter(Boolean)
    .join("");

  return `${lineArtMarkup}${starsFieldMarkup}${layerBoxMarkup}`;
}

export function captureAuthoredStarsFieldParallaxRefs(overlayEl = null) {
  if (!overlayEl || typeof overlayEl.querySelectorAll !== "function") return Object.freeze([]);
  return Object.freeze(Array.from(overlayEl.querySelectorAll("[data-stars-band]")).map((el) => ({
    el,
    ratio: Math.max(0, Math.min(1, clampNumber(el.getAttribute("data-parallax-ratio"), 0))),
    fieldLeft: clampNumber(el.getAttribute("data-field-left"), 0),
    fieldTop: clampNumber(el.getAttribute("data-field-top"), 0),
    fieldWidth: Math.max(1, clampNumber(el.getAttribute("data-field-width"), 1)),
    fieldHeight: Math.max(1, clampNumber(el.getAttribute("data-field-height"), 1)),
    cameraLeft: clampNumber(el.getAttribute("data-camera-left"), 0),
    cameraTop: clampNumber(el.getAttribute("data-camera-top"), 0),
    cameraRight: clampNumber(el.getAttribute("data-camera-right"), 0),
    cameraBottom: clampNumber(el.getAttribute("data-camera-bottom"), 0),
    strokeRect: el.querySelector("[data-stars-box-stroke='true']"),
    patternRect: el.querySelector("[data-stars-box-pattern='true']"),
  })));
}

export function applyAuthoredStarsFieldParallax(parallaxRefs = [], {
  camLeft = 0,
  camTop = 0,
  zoom = 1,
  viewportWidthPx = 0,
  viewportHeightPx = 0,
} = {}) {
  const safeRefs = Array.isArray(parallaxRefs) ? parallaxRefs : [];
  const left = clampNumber(camLeft, 0);
  const top = clampNumber(camTop, 0);
  const nextZoom = Math.max(0.05, clampNumber(zoom, 1));
  const viewportWidthW = Math.max(0, clampNumber(viewportWidthPx, 0) / nextZoom);
  const viewportHeightW = Math.max(0, clampNumber(viewportHeightPx, 0) / nextZoom);
  for (const ref of safeRefs) {
    if (!ref || !ref.el || typeof ref.el.setAttribute !== "function") continue;
    const ratio = Math.max(0, Math.min(1, clampNumber(ref.ratio, 1)));
    const xRange = resolveTravelRange(ref.cameraLeft, ref.cameraRight, viewportWidthW, ref.cameraLeft);
    const yRange = resolveTravelRange(ref.cameraTop, ref.cameraBottom, viewportHeightW, ref.cameraTop);
    const travelX = Math.max(0, xRange.max - xRange.min);
    const travelY = Math.max(0, yRange.max - yRange.min);
    const driftX = travelX * ratio;
    const driftY = travelY * ratio;
    const progressX = travelX > 0 ? Math.max(0, Math.min(1, (left - xRange.min) / travelX)) : 0.5;
    const progressY = travelY > 0 ? Math.max(0, Math.min(1, (top - yRange.min) / travelY)) : 0.5;
    const tx = (0.5 - progressX) * driftX;
    const ty = (0.5 - progressY) * driftY;
    const boxLeft = ref.fieldLeft - (driftX * 0.5);
    const boxTop = ref.fieldTop - (driftY * 0.5);
    const boxWidth = ref.fieldWidth + driftX;
    const boxHeight = ref.fieldHeight + driftY;
    if (ref.strokeRect && typeof ref.strokeRect.setAttribute === "function") {
      ref.strokeRect.setAttribute("x", formatNumberAttr(boxLeft, ref.fieldLeft));
      ref.strokeRect.setAttribute("y", formatNumberAttr(boxTop, ref.fieldTop));
      ref.strokeRect.setAttribute("width", formatNumberAttr(boxWidth, ref.fieldWidth));
      ref.strokeRect.setAttribute("height", formatNumberAttr(boxHeight, ref.fieldHeight));
    }
    if (ref.patternRect && typeof ref.patternRect.setAttribute === "function") {
      ref.patternRect.setAttribute("x", formatNumberAttr(boxLeft, ref.fieldLeft));
      ref.patternRect.setAttribute("y", formatNumberAttr(boxTop, ref.fieldTop));
      ref.patternRect.setAttribute("width", formatNumberAttr(boxWidth, ref.fieldWidth));
      ref.patternRect.setAttribute("height", formatNumberAttr(boxHeight, ref.fieldHeight));
    }
    const next = formatSvgTranslate(tx, ty);
    if (ref.el.__authoredParallaxTransform === next) continue;
    ref.el.__authoredParallaxTransform = next;
    ref.el.setAttribute("transform", next);
  }
}
