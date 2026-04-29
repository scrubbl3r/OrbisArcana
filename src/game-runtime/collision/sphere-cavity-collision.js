function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  const n = clampNumber(value, min);
  return Math.max(min, Math.min(max, n));
}

function normalizeVector3(x = 0, y = 0, z = 0, fallback = { x: 0, y: -1, z: 0 }) {
  const dx = clampNumber(x, 0);
  const dy = clampNumber(y, 0);
  const dz = clampNumber(z, 0);
  const length = Math.hypot(dx, dy, dz);
  if (length <= 0.000001) {
    return Object.freeze({
      x: clampNumber(fallback && fallback.x, 0),
      y: clampNumber(fallback && fallback.y, -1),
      z: clampNumber(fallback && fallback.z, 0),
    });
  }
  return Object.freeze({
    x: dx / length,
    y: dy / length,
    z: dz / length,
  });
}

function closestPointOnSegment2D({
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
    return Object.freeze({ xW: ax, yW: ay, t: 0 });
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

  const fallback = strongest
    ? { x: strongest.normalX, y: strongest.normalY, z: 0 }
    : { x: 0, y: -1, z: 0 };
  const aggregateNormal = normalizeVector3(sumNormalX, sumNormalY, 0, fallback);

  let requiredDepth = 0;
  for (const hit of safeHits) {
    if (!hit) continue;
    const alignment = (
      (aggregateNormal.x * clampNumber(hit.normalX, 0))
      + (aggregateNormal.y * clampNumber(hit.normalY, -1))
    );
    const safeAlignment = Math.max(0.15, alignment);
    requiredDepth = Math.max(requiredDepth, clampNumber(hit.depth, 0) / safeAlignment);
  }

  return Object.freeze({
    normalX: aggregateNormal.x,
    normalY: aggregateNormal.y,
    depth: Math.max(requiredDepth, maxDepth),
    grounded,
    strongest,
  });
}

export function resolveSphereVsExtrudedBoundarySegment({
  sphereXW = 0,
  sphereYW = 0,
  sphereZBO = 0,
  radiusW = 0,
  segment = null,
  depthBO = 0,
  boWorldUnits = 72,
  previousXW = null,
  previousYW = null,
} = {}) {
  const safeRadius = Math.max(0, clampNumber(radiusW, 0));
  const safeBO = Math.max(1, clampNumber(boWorldUnits, 72));
  const safeDepthBO = Math.max(0, clampNumber(depthBO, 0));
  const closestXY = closestPointOnSegment2D({
    pointXW: sphereXW,
    pointYW: sphereYW,
    segment,
  });
  if (!closestXY || !segment) return null;

  const sphereDepthW = Math.max(0, clampNumber(sphereZBO, 0)) * safeBO;
  const closestDepthW = clamp(sphereDepthW, 0, safeDepthBO * safeBO);
  const dx = clampNumber(sphereXW, 0) - clampNumber(closestXY.xW, 0);
  const dy = clampNumber(sphereYW, 0) - clampNumber(closestXY.yW, 0);
  const dz = sphereDepthW - closestDepthW;
  const distSq = (dx * dx) + (dy * dy) + (dz * dz);
  const radiusSq = safeRadius * safeRadius;
  if (distSq > radiusSq) return null;

  let normal = null;
  const distance = Math.sqrt(Math.max(0, distSq));
  if (distance > 0.000001) {
    normal = normalizeVector3(dx, dy, dz);
  } else {
    const a = segment.a || {};
    const b = segment.b || {};
    const tangentX = clampNumber(b.xW, 0) - clampNumber(a.xW, 0);
    const tangentY = clampNumber(b.yW, 0) - clampNumber(a.yW, 0);
    const fallbackNormal = normalizeVector3(-tangentY, tangentX, 0);
    const prevDx = Number.isFinite(Number(previousXW))
      ? (clampNumber(previousXW, 0) - clampNumber(closestXY.xW, 0))
      : fallbackNormal.x;
    const prevDy = Number.isFinite(Number(previousYW))
      ? (clampNumber(previousYW, 0) - clampNumber(closestXY.yW, 0))
      : fallbackNormal.y;
    normal = ((prevDx * fallbackNormal.x) + (prevDy * fallbackNormal.y)) >= 0
      ? fallbackNormal
      : Object.freeze({ x: -fallbackNormal.x, y: -fallbackNormal.y, z: 0 });
  }

  const depth = Math.max(0, safeRadius - distance);
  if (depth <= 0) return null;
  return Object.freeze({
    segmentId: String(segment.id || ""),
    pointXW: clampNumber(closestXY.xW, 0),
    pointYW: clampNumber(closestXY.yW, 0),
    pointZBO: closestDepthW / safeBO,
    normalX: clampNumber(normal.x, 0),
    normalY: clampNumber(normal.y, -1),
    normalZ: clampNumber(normal.z, 0),
    depth,
  });
}

export function resolveSphereVsExtrudedBoundarySegments({
  sphereXW = 0,
  sphereYW = 0,
  sphereZBO = 0,
  radiusW = 0,
  segments = [],
  depthBO = 0,
  boWorldUnits = 72,
  previousXW = null,
  previousYW = null,
  maxIterations = 3,
  target = null,
} = {}) {
  let resolvedXW = clampNumber(sphereXW, 0);
  let resolvedYW = clampNumber(sphereYW, 0);
  let grounded = false;
  let maxDepth = 0;
  const contacts = target && Array.isArray(target.contacts) ? target.contacts : [];
  contacts.length = 0;
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
      const hit = resolveSphereVsExtrudedBoundarySegment({
        sphereXW: resolvedXW,
        sphereYW: resolvedYW,
        sphereZBO,
        radiusW: safeRadius,
        segment,
        depthBO,
        boWorldUnits,
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

  const result = target || {};
  result.xW = resolvedXW;
  result.yW = resolvedYW;
  result.zBO = Math.max(0, clampNumber(sphereZBO, 0));
  result.correctionXW = resolvedXW - clampNumber(sphereXW, 0);
  result.correctionYW = resolvedYW - clampNumber(sphereYW, 0);
  result.grounded = grounded;
  result.maxDepth = maxDepth;
  result.contacts = contacts;
  return target ? result : Object.freeze({
    ...result,
    contacts: Object.freeze(contacts),
  });
}
