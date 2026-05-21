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

function dot(ax = 0, ay = 0, bx = 0, by = 0) {
  return (clampNumber(ax, 0) * clampNumber(bx, 0)) + (clampNumber(ay, 0) * clampNumber(by, 0));
}

function resolveAuthoredSegmentNormal(segment = null) {
  if (!segment) return null;
  const nx = Number(segment.normalX);
  const ny = Number(segment.normalY);
  const length = Math.hypot(nx, ny);
  if (!Number.isFinite(nx) || !Number.isFinite(ny) || length <= 0.000001) return null;
  return Object.freeze({ x: nx / length, y: ny / length });
}

function buildAggregateContactResponse(hits = []) {
  const safeHits = Array.isArray(hits) ? hits : [];
  if (!safeHits.length) return null;

  let sumNormalX = 0;
  let sumNormalY = 0;
  let grounded = false;
  let maxDepth = 0;
  let strongest = safeHits[0] || null;
  for (const hit of safeHits) {
    if (!hit) continue;
    const depth = Math.max(0, clampNumber(hit.depth, 0));
    const nx = clampNumber(hit.normalX, 0);
    const ny = clampNumber(hit.normalY, -1);
    sumNormalX += nx * depth;
    sumNormalY += ny * depth;
    if (ny < -0.55) grounded = true;
    if (depth > maxDepth) maxDepth = depth;
    if (!strongest || depth > clampNumber(strongest.depth, 0)) strongest = hit;
  }

  const aggregateNormal = normalizeVector(
    sumNormalX,
    sumNormalY,
    strongest
      ? { x: strongest.normalX, y: strongest.normalY }
      : { x: 0, y: -1 }
  );

  let requiredDepth = 0;
  for (const hit of safeHits) {
    if (!hit) continue;
    const alignment = dot(
      aggregateNormal.x,
      aggregateNormal.y,
      hit.normalX,
      hit.normalY
    );
    const safeAlignment = Math.max(0.15, alignment);
    requiredDepth = Math.max(requiredDepth, clampNumber(hit.depth, 0) / safeAlignment);
  }

  return Object.freeze({
    normalX: clampNumber(aggregateNormal.x, 0),
    normalY: clampNumber(aggregateNormal.y, -1),
    depth: Math.max(requiredDepth, maxDepth),
    grounded,
    strongest,
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
  const authoredNormal = resolveAuthoredSegmentNormal(segment);
  if (authoredNormal) {
    normal = authoredNormal;
  } else if (distance > 0.000001) {
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
    const hits = [];
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
      hits.push(hit);
    }
    if (!hits.length) break;
    const response = buildAggregateContactResponse(hits);
    if (!response || response.depth <= 0) break;
    resolvedXW += response.normalX * response.depth;
    resolvedYW += response.normalY * response.depth;
    maxDepth = Math.max(maxDepth, response.depth);
    if (response.grounded) grounded = true;
    contacts.push(...hits);
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
