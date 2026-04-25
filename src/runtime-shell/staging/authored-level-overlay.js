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

function formatSvgTranslate(x = 0, y = 0) {
  return `translate(${clampNumber(x, 0).toFixed(2)} ${clampNumber(y, 0).toFixed(2)})`;
}

function starWithinRenderRegion(star = {}, regions = [], marginW = 0) {
  const xW = clampNumber(star.xW, 0);
  const yW = clampNumber(star.yW, 0);
  const margin = Math.max(0, clampNumber(marginW, 0));
  const safeRegions = Array.isArray(regions) ? regions : [];
  return safeRegions.some((region = {}) => {
    const box = region && region.boundaryBox ? region.boundaryBox : null;
    if (!box) return false;
    return (
      xW >= (clampNumber(box.leftXW, 0) - margin) &&
      xW <= (clampNumber(box.rightXW, 0) + margin) &&
      yW >= (clampNumber(box.topYW, 0) - margin) &&
      yW <= (clampNumber(box.bottomYW, 0) + margin)
    );
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
  const starsFieldMarkup = clipRegions
    .map((region = {}, index) => {
      const pathData = buildClosedLoopPathData(region.worldPoints);
      if (!pathData) return "";
      return `<path class="authoredStarsFieldDebugOutline" data-stars-field-path="${String(region.id || `stars_field_${index + 1}`)}" d="${pathData}" style="fill:none;stroke:rgba(255,64,64,0.96);stroke-width:6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;"></path>`;
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

  return `${starsFieldMarkup}${lineArtMarkup}`;
}

export function captureAuthoredStarsFieldParallaxRefs(overlayEl = null) {
  return Object.freeze([]);
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
