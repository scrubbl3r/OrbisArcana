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

export function buildAuthoredLevelOverlayMarkup({
  starsField = null,
  loops = [],
  lineArtShapes = [],
} = {}) {
  const stars = Array.isArray(starsField && starsField.stars) ? starsField.stars : [];
  const starsMarkup = stars
    .map((star = {}, index) => {
      const bandId = String(star && star.depthBand || "mid").trim() || "mid";
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
