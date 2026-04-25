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
  const clipEnabled = !!(starsField && starsField.config && starsField.config.enableClipMask);
  const safeOverlayId = String(overlayId || "authoredOverlay").replace(/[^a-zA-Z0-9_-]/g, "_");
  const maskId = clipEnabled && clipRegions.length ? `${safeOverlayId}__starsFieldMask` : "";
  const maskWidth = Math.max(1, clampNumber(worldWidthPx, 0));
  const maskHeight = Math.max(1, clampNumber(worldHeightPx, 0));
  const renderCullMarginW = clampNumber(
    starsField && starsField.config && starsField.config.renderCullMarginW,
    starsField && starsField.config && starsField.config.parallaxMarginW
  );
  const stars = Array.isArray(starsField && starsField.stars)
    ? starsField.stars.filter((star) => starWithinRenderRegion(star, clipRegions, renderCullMarginW))
    : [];
  const starsByBand = new Map();
  for (const star of stars) {
    const bandId = String(star && star.depthBand || "mid").trim() || "mid";
    const bandStars = starsByBand.get(bandId) || [];
    bandStars.push(star);
    starsByBand.set(bandId, bandStars);
  }
  const clipMarkup = maskId
    ? `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"><rect x="0" y="0" width="${maskWidth}" height="${maskHeight}" fill="black"></rect>${clipRegions
        .map((region = {}, index) => {
          const pathData = buildClosedLoopPathData(region.worldPoints);
          if (!pathData) return "";
          return `<path d="${pathData}" data-stars-clip-region="${String(region.id || `stars_clip_${index + 1}`)}" fill="white"></path>`;
        })
        .filter(Boolean)
        .join("")}</mask></defs>`
    : "";
  const debugOutlineMarkup = (starsField && starsField.config && starsField.config.showDebugOutline)
    ? clipRegions
      .map((region = {}, index) => {
        const pathData = buildClosedLoopPathData(region.worldPoints);
        if (!pathData) return "";
        return `<path class="authoredStarsFieldDebugOutline" data-stars-debug-outline="${String(region.id || `stars_outline_${index + 1}`)}" d="${pathData}" style="fill:none;stroke:rgba(255,64,64,0.96);stroke-width:6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;"></path>`;
      })
      .filter(Boolean)
      .join("")
    : "";
  const starsMarkup = Array.from(starsByBand.entries())
    .map(([bandId, bandStars]) => {
      const ratio = Math.max(0, Math.min(1, clampNumber(bandStars[0] && bandStars[0].parallaxRatio, 1)));
      const bandMarkup = bandStars.map((star = {}, index) => {
        const x = clampNumber(star.xW, 0).toFixed(2);
        const y = clampNumber(star.yW, 0).toFixed(2);
        const r = Math.max(0.25, clampNumber(star.radiusPx, 1)).toFixed(2);
        const opacity = Math.max(0, Math.min(1, clampNumber(star.opacity, 0.4))).toFixed(3);
        const color = String(star.color || "#ffffff").trim() || "#ffffff";
        const haloOpacity = Math.max(0, Math.min(1, clampNumber(star.haloOpacity, 0))).toFixed(3);
        const haloRadius = Math.max(r, clampNumber(star.haloRadiusPx, Number(r))).toFixed(2);
        const starId = String(star.id || `${bandId}_star_${index + 1}`);
        const haloMarkup = clampNumber(star.haloOpacity, 0) > 0
          ? `<circle class="authoredStarsFieldHalo" data-star-halo-id="${starId}" data-depth-band="${bandId}" data-star-origin="${star.insideCore ? "core" : "margin"}" cx="${x}" cy="${y}" r="${haloRadius}" style="fill:${color};fill-opacity:${haloOpacity};stroke:none;"></circle>`
          : "";
        return `${haloMarkup}<circle class="authoredStarsFieldStar${star.isHighlight ? " authoredStarsFieldStarHighlight" : ""}" data-star-id="${starId}" data-depth-band="${bandId}" data-star-origin="${star.insideCore ? "core" : "margin"}" cx="${x}" cy="${y}" r="${r}" style="fill:${color};fill-opacity:${opacity};stroke:none;"></circle>`;
      }).join("");
      return `<g class="authoredStarsFieldLayer authoredStarsFieldLayer--${bandId}" data-stars-band="${bandId}" data-parallax-ratio="${ratio.toFixed(3)}" transform="${formatSvgTranslate(0, 0)}">${bandMarkup}</g>`;
    })
    .join("");
  const starsRootMarkup = starsMarkup
    ? `<g class="authoredStarsFieldRoot"${maskId ? ` mask="url(#${maskId})"` : ""}>${starsMarkup}</g>`
    : "";

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

  return `${clipMarkup}${starsRootMarkup}${debugOutlineMarkup}${lineArtMarkup}`;
}

export function captureAuthoredStarsFieldParallaxRefs(overlayEl = null) {
  if (!overlayEl || typeof overlayEl.querySelectorAll !== "function") return Object.freeze([]);
  const refs = Array.from(overlayEl.querySelectorAll("[data-stars-band]"))
    .map((el) => ({
      el,
      ratio: Math.max(0, Math.min(1, clampNumber(el.getAttribute("data-parallax-ratio"), 1))),
      baseCamLeft: null,
      baseCamTop: null,
    }));
  return Object.freeze(refs);
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
