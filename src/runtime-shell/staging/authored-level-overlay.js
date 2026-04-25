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

function formatSvgTranslate(x = 0, y = 0) {
  return `translate(${clampNumber(x, 0).toFixed(2)} ${clampNumber(y, 0).toFixed(2)})`;
}

export function buildAuthoredLevelOverlayMarkup({
  starsField = null,
  loops = [],
  lineArtShapes = [],
} = {}) {
  const stars = Array.isArray(starsField && starsField.stars) ? starsField.stars : [];
  const starsByBand = new Map();
  for (const star of stars) {
    const bandId = String(star && star.depthBand || "mid").trim() || "mid";
    const bandStars = starsByBand.get(bandId) || [];
    bandStars.push(star);
    starsByBand.set(bandId, bandStars);
  }
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
          ? `<circle class="authoredStarsFieldHalo" data-star-halo-id="${starId}" data-depth-band="${bandId}" cx="${x}" cy="${y}" r="${haloRadius}" style="fill:${color};fill-opacity:${haloOpacity};stroke:none;"></circle>`
          : "";
        return `${haloMarkup}<circle class="authoredStarsFieldStar${star.isHighlight ? " authoredStarsFieldStarHighlight" : ""}" data-star-id="${starId}" data-depth-band="${bandId}" cx="${x}" cy="${y}" r="${r}" style="fill:${color};fill-opacity:${opacity};stroke:none;"></circle>`;
      }).join("");
      return `<g class="authoredStarsFieldLayer authoredStarsFieldLayer--${bandId}" data-stars-band="${bandId}" data-parallax-ratio="${ratio.toFixed(3)}" transform="${formatSvgTranslate(0, 0)}">${bandMarkup}</g>`;
    })
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

  return `${starsMarkup}${lineArtMarkup}`;
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
