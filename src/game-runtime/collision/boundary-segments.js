function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveLoopSignedArea(points = []) {
  let area = 0;
  const safePoints = Array.isArray(points) ? points : [];
  for (let index = 0; index < safePoints.length; index += 1) {
    const a = safePoints[index] || {};
    const b = safePoints[(index + 1) % safePoints.length] || {};
    area += (clampNumber(a.xW, 0) * clampNumber(b.yW, 0))
      - (clampNumber(b.xW, 0) * clampNumber(a.yW, 0));
  }
  return area * 0.5;
}

function resolveSegmentInwardNormal(a = {}, b = {}, clockwise = true) {
  const tangentX = clampNumber(b.xW, 0) - clampNumber(a.xW, 0);
  const tangentY = clampNumber(b.yW, 0) - clampNumber(a.yW, 0);
  const length = Math.hypot(tangentX, tangentY);
  if (length <= 0.000001) return { x: 0, y: -1 };
  return clockwise
    ? { x: tangentY / length, y: -tangentX / length }
    : { x: -tangentY / length, y: tangentX / length };
}

export function buildBoundarySegmentsFromLoops(loops = []) {
  const segments = [];
  for (const loop of Array.isArray(loops) ? loops : []) {
    const loopId = String(loop && loop.id || "loop");
    const points = Array.isArray(loop && loop.worldPoints) ? loop.worldPoints : [];
    const clockwise = resolveLoopSignedArea(points) < 0;
    for (let index = 0; index < (points.length - 1); index += 1) {
      const a = points[index] || {};
      const b = points[index + 1] || {};
      const ax = clampNumber(a.xW, NaN);
      const ay = clampNumber(a.yW, NaN);
      const bx = clampNumber(b.xW, NaN);
      const by = clampNumber(b.yW, NaN);
      if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) continue;
      if (ax === bx && ay === by) continue;
      const inwardNormal = resolveSegmentInwardNormal({ xW: ax, yW: ay }, { xW: bx, yW: by }, clockwise);
      segments.push(Object.freeze({
        id: `${loopId}:seg_${index + 1}`,
        loopId,
        index,
        a: Object.freeze({ xW: ax, yW: ay }),
        b: Object.freeze({ xW: bx, yW: by }),
        normalX: inwardNormal.x,
        normalY: inwardNormal.y,
        minXW: Math.min(ax, bx),
        minYW: Math.min(ay, by),
        maxXW: Math.max(ax, bx),
        maxYW: Math.max(ay, by),
      }));
    }
  }
  return Object.freeze(segments);
}
