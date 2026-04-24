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
  loops = [],
  lineArtShapes = [],
  viewFloorGuides = [],
} = {}) {
  const boundaryMarkup = (Array.isArray(loops) ? loops : [])
    .map((loop = {}, index) => {
      const pathData = buildLoopPathData(loop.worldPoints);
      if (!pathData) return "";
      return `<path class="levelStageBoundaryPath" data-loop-id="${String(loop.id || `loop_${index + 1}`)}" d="${pathData}"></path>`;
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

  const viewFloorMarkup = (Array.isArray(viewFloorGuides) ? viewFloorGuides : [])
    .map((guide = {}, index) => {
      const pathData = buildLoopPathData(guide.worldPoints);
      if (!pathData) return "";
      return `<path class="levelStageViewFloorPath" data-view-floor-id="${String(guide.id || `view_floor_${index + 1}`)}" d="${pathData}"></path>`;
    })
    .filter(Boolean)
    .join("");

  return `${boundaryMarkup}${lineArtMarkup}${viewFloorMarkup}`;
}
