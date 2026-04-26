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
  const stars = Array.isArray(starsField && starsField.stars) ? starsField.stars : [];
  const clipPathMarkup = clipRegions
    .map((region = {}, index) => {
      const pathData = buildClosedLoopPathData(region.worldPoints);
      if (!pathData) return "";
      return `<path d="${pathData}"></path>`;
    })
    .filter(Boolean)
    .join("");
  const clipId = `${overlayId}__stars_field_clip`;
  const layerBoxMarkup = layerBoxes
    .map((layer = {}, index) => {
      const box = layer && layer.boundaryBox ? layer.boundaryBox : null;
      if (!box) return "";
      const sourceBox = layer && layer.sourceBoundaryBox ? layer.sourceBoundaryBox : box;
      const cameraBox = layer && layer.cameraBoundaryBox ? layer.cameraBoundaryBox : sourceBox;
      const x = formatNumberAttr(clampNumber(sourceBox.leftXW, 0), 0);
      const y = formatNumberAttr(clampNumber(sourceBox.topYW, 0), 0);
      const ratio = Math.max(0, Math.min(1, clampNumber(layer.parallaxRatio, 0)));
      const layerId = String(layer.layerId || `layer_${index + 1}`);
      const layerStarsMarkup = stars
        .filter((star = {}) => String(star.depthBand || "") === layerId)
        .map((star = {}, starIndex) => {
          const cx = formatNumberAttr(star.localXW, 0);
          const cy = formatNumberAttr(star.localYW, 0);
          const r = formatNumberAttr(Math.max(0.6, clampNumber(star.radiusPx, 1)), 1);
          const fill = String(star.color || "#ffffff");
          const opacity = Math.max(0, Math.min(1, clampNumber(star.opacity, 1)));
          const halo = star.isHighlight
            ? `<circle cx="${cx}" cy="${cy}" r="${formatNumberAttr(Math.max(r * 3, clampNumber(star.haloRadiusPx, 3)), 3)}" fill="${fill}" fill-opacity="${Math.max(0, Math.min(1, clampNumber(star.haloOpacity, 0.1))).toFixed(3)}" stroke="none"></circle>`
            : "";
          return `${halo}<circle data-stars-real-star="${layerId}:${starIndex}" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity.toFixed(3)}" stroke="none"></circle>`;
        })
        .join("");
      return `<g class="authoredStarsFieldLayer authoredStarsFieldLayer--${layerId}" data-stars-band="${layerId}" data-parallax-ratio="${ratio.toFixed(3)}" data-field-left="${formatNumberAttr(sourceBox.leftXW, 0)}" data-field-top="${formatNumberAttr(sourceBox.topYW, 0)}" data-field-width="${formatNumberAttr(sourceBox.widthW, 1)}" data-field-height="${formatNumberAttr(sourceBox.heightW, 1)}" data-camera-left="${formatNumberAttr(cameraBox.leftXW, 0)}" data-camera-top="${formatNumberAttr(cameraBox.topYW, 0)}" data-camera-right="${formatNumberAttr(cameraBox.rightXW, 0)}" data-camera-bottom="${formatNumberAttr(cameraBox.bottomYW, 0)}" transform="${formatSvgTranslate(0, 0)}"><g data-stars-layer-content="true" transform="translate(${x} ${y})">${layerStarsMarkup}</g></g>`;
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

  const clippedStarsMarkup = clipPathMarkup
    ? `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse">${clipPathMarkup}</clipPath></defs><g data-stars-field-root="true" clip-path="url(#${clipId})">${layerBoxMarkup}</g>`
    : layerBoxMarkup;

  return `${lineArtMarkup}${clippedStarsMarkup}`;
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
    contentGroup: el.querySelector("[data-stars-layer-content='true']"),
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
  const viewportRightW = left + viewportWidthW;
  const viewportBottomW = top + viewportHeightW;
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
    const boxWidth = ref.fieldWidth + driftX;
    const boxHeight = ref.fieldHeight + driftY;
    const boxLeft = (ref.fieldLeft - (driftX * 0.5)) + tx;
    const boxTop = (ref.fieldTop - (driftY * 0.5)) + ty;
    const boxRight = boxLeft + boxWidth;
    const boxBottom = boxTop + boxHeight;
    const isVisible = !(
      boxRight < left
      || boxLeft > viewportRightW
      || boxBottom < top
      || boxTop > viewportBottomW
    );
    if (ref.el.__authoredParallaxVisible !== isVisible) {
      ref.el.__authoredParallaxVisible = isVisible;
      ref.el.style.display = isVisible ? "" : "none";
    }
    if (!isVisible) continue;
    if (ref.contentGroup && typeof ref.contentGroup.setAttribute === "function") {
      const nextContentTransform = `translate(${formatNumberAttr(ref.fieldLeft - (driftX * 0.5), ref.fieldLeft)} ${formatNumberAttr(ref.fieldTop - (driftY * 0.5), ref.fieldTop)}) scale(${(boxWidth / Math.max(1, ref.fieldWidth)).toFixed(4)} ${(boxHeight / Math.max(1, ref.fieldHeight)).toFixed(4)})`;
      if (ref.contentGroup.__authoredParallaxTransform !== nextContentTransform) {
        ref.contentGroup.__authoredParallaxTransform = nextContentTransform;
        ref.contentGroup.setAttribute("transform", nextContentTransform);
      }
    }
    const next = formatSvgTranslate(tx, ty);
    if (ref.el.__authoredParallaxTransform === next) continue;
    ref.el.__authoredParallaxTransform = next;
    ref.el.setAttribute("transform", next);
  }
}
