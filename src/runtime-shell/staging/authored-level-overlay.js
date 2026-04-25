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
      return `<path class="authoredStarsFieldDebugOutline" data-stars-field-path="${String(region.id || `stars_field_${index + 1}`)}" d="${pathData}" style="fill:none;stroke:rgba(255,32,32,0.98);stroke-width:16;stroke-dasharray:28 20;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;"></path>`;
    })
    .filter(Boolean)
    .join("");
  const layerBoxMarkup = layerBoxes
    .map((layer = {}, index) => {
      const box = layer && layer.boundaryBox ? layer.boundaryBox : null;
      if (!box) return "";
      const x = clampNumber(box.leftXW, 0).toFixed(2);
      const y = clampNumber(box.topYW, 0).toFixed(2);
      const width = Math.max(1, clampNumber(box.widthW, 1)).toFixed(2);
      const height = Math.max(1, clampNumber(box.heightW, 1)).toFixed(2);
      const ratio = Math.max(0, Math.min(1, clampNumber(layer.parallaxRatio, 0)));
      const stroke = String(layer.stroke || ["#ff9f2f", "#38d66b", "#4aa3ff"][index] || "#ffffff");
      return `<g class="authoredStarsFieldLayer authoredStarsFieldLayer--${String(layer.layerId || `layer_${index + 1}`)}" data-stars-band="${String(layer.layerId || `layer_${index + 1}`)}" data-parallax-ratio="${ratio.toFixed(3)}" transform="${formatSvgTranslate(0, 0)}"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${stroke}" stroke-width="10" stroke-linejoin="round" vector-effect="non-scaling-stroke"></rect></g>`;
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
    baseCamLeft: null,
    baseCamTop: null,
  })));
}

export function applyAuthoredStarsFieldParallax(parallaxRefs = [], {
  camLeft = 0,
  camTop = 0,
} = {}) {
  const safeRefs = Array.isArray(parallaxRefs) ? parallaxRefs : [];
  const left = clampNumber(camLeft, 0);
  const top = clampNumber(camTop, 0);
  for (const ref of safeRefs) {
    if (!ref || !ref.el || typeof ref.el.setAttribute !== "function") continue;
    const ratio = Math.max(0, Math.min(1, clampNumber(ref.ratio, 1)));
    if (!Number.isFinite(ref.baseCamLeft)) {
      ref.baseCamLeft = left;
    }
    if (!Number.isFinite(ref.baseCamTop)) {
      ref.baseCamTop = top;
    }
    const deltaLeft = left - clampNumber(ref.baseCamLeft, left);
    const deltaTop = top - clampNumber(ref.baseCamTop, top);
    const tx = deltaLeft * (1 - ratio);
    const ty = deltaTop * (1 - ratio);
    const next = formatSvgTranslate(tx, ty);
    if (ref.el.__authoredParallaxTransform === next) continue;
    ref.el.__authoredParallaxTransform = next;
    ref.el.setAttribute("transform", next);
  }
}
