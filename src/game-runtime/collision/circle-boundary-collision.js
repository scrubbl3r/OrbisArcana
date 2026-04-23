function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  const n = clampNumber(value, min);
  return Math.max(min, Math.min(max, n));
}

function normalizeVector(x = 0, y = 0, fallback = { x: 0, y: -1 }) {
  const dx = clampNumber(x, 0);
  const dy = clampNumber(y, 0);
  const length = Math.hypot(dx, dy);
  if (length <= 0.000001) {
    return Object.freeze({
      x: clampNumber(fallback && fallback.x, 0),
      y: clampNumber(fallback && fallback.y, -1),
    });
  }
  return Object.freeze({
    x: dx / length,
    y: dy / length,
  });
}

export function closestPointOnSegment({
  pointXW = 0,
  pointYW = 0,
  segment = null,
} = {}) {
  const a = segment && segment.a ? segment.a : null;
  const b = segment && segment.b ? segment.b : null;
  if (!a || !b) return null;
  const ax = clampNumber(a.xW, 0);
  const ay = clampNumber(a.yW, 0);
  const bx = clampNumber(b.xW, 0);
  const by = clampNumber(b.yW, 0);
  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = (abx * abx) + (aby * aby);
  if (abLenSq <= 0.000001) {
    return Object.freeze({
      xW: ax,
      yW: ay,
      t: 0,
    });
  }
  const apx = clampNumber(pointXW, 0) - ax;
  const apy = clampNumber(pointYW, 0) - ay;
  const t = clamp(((apx * abx) + (apy * aby)) / abLenSq, 0, 1);
  return Object.freeze({
    xW: ax + (abx * t),
    yW: ay + (aby * t),
    t,
  });
}

export function resolveCircleVsSegmentPenetration({
  circleXW = 0,
  circleYW = 0,
  radiusW = 0,
  segment = null,
  previousXW = null,
  previousYW = null,
} = {}) {
  const safeRadius = Math.max(0, clampNumber(radiusW, 0));
  const point = closestPointOnSegment({
    pointXW: circleXW,
    pointYW: circleYW,
    segment,
  });
  if (!point || !segment) return null;
  const dx = clampNumber(circleXW, 0) - clampNumber(point.xW, 0);
  const dy = clampNumber(circleYW, 0) - clampNumber(point.yW, 0);
  const distSq = (dx * dx) + (dy * dy);
  const radiusSq = safeRadius * safeRadius;
  if (distSq > radiusSq) return null;

  let normal = null;
  let distance = Math.sqrt(Math.max(0, distSq));
  if (distance > 0.000001) {
    normal = normalizeVector(dx, dy);
  } else {
    const a = segment.a || {};
    const b = segment.b || {};
    const tangentX = clampNumber(b.xW, 0) - clampNumber(a.xW, 0);
    const tangentY = clampNumber(b.yW, 0) - clampNumber(a.yW, 0);
    const fallbackNormal = normalizeVector(-tangentY, tangentX);
    const prevDx = Number.isFinite(Number(previousXW)) ? (clampNumber(previousXW, 0) - clampNumber(point.xW, 0)) : fallbackNormal.x;
    const prevDy = Number.isFinite(Number(previousYW)) ? (clampNumber(previousYW, 0) - clampNumber(point.yW, 0)) : fallbackNormal.y;
    const aligned = ((prevDx * fallbackNormal.x) + (prevDy * fallbackNormal.y)) >= 0
      ? fallbackNormal
      : Object.freeze({ x: -fallbackNormal.x, y: -fallbackNormal.y });
    normal = aligned;
    distance = 0;
  }

  const depth = Math.max(0, safeRadius - distance);
  if (depth <= 0) return null;
  return Object.freeze({
    segmentId: String(segment.id || ""),
    pointXW: clampNumber(point.xW, 0),
    pointYW: clampNumber(point.yW, 0),
    normalX: clampNumber(normal.x, 0),
    normalY: clampNumber(normal.y, -1),
    depth,
  });
}

export function resolveCircleVsBoundarySegments({
  circleXW = 0,
  circleYW = 0,
  radiusW = 0,
  segments = [],
  previousXW = null,
  previousYW = null,
  maxIterations = 3,
} = {}) {
  let resolvedXW = clampNumber(circleXW, 0);
  let resolvedYW = clampNumber(circleYW, 0);
  let grounded = false;
  let maxDepth = 0;
  const contacts = [];
  const safeRadius = Math.max(0, clampNumber(radiusW, 0));
  const safeSegments = Array.isArray(segments) ? segments : [];

  for (let iteration = 0; iteration < Math.max(1, clampNumber(maxIterations, 1)); iteration += 1) {
    let best = null;
    for (const segment of safeSegments) {
      if (!segment) continue;
      const minX = clampNumber(segment.minXW, 0) - safeRadius;
      const maxX = clampNumber(segment.maxXW, 0) + safeRadius;
      const minY = clampNumber(segment.minYW, 0) - safeRadius;
      const maxY = clampNumber(segment.maxYW, 0) + safeRadius;
      if (resolvedXW < minX || resolvedXW > maxX || resolvedYW < minY || resolvedYW > maxY) continue;
      const hit = resolveCircleVsSegmentPenetration({
        circleXW: resolvedXW,
        circleYW: resolvedYW,
        radiusW: safeRadius,
        segment,
        previousXW,
        previousYW,
      });
      if (!hit) continue;
      if (!best || hit.depth > best.depth) best = hit;
    }
    if (!best) break;
    resolvedXW += best.normalX * best.depth;
    resolvedYW += best.normalY * best.depth;
    maxDepth = Math.max(maxDepth, best.depth);
    if (best.normalY < -0.55) grounded = true;
    contacts.push(best);
  }

  return Object.freeze({
    xW: resolvedXW,
    yW: resolvedYW,
    correctionXW: resolvedXW - clampNumber(circleXW, 0),
    correctionYW: resolvedYW - clampNumber(circleYW, 0),
    grounded,
    maxDepth,
    contacts: Object.freeze(contacts),
  });
}
