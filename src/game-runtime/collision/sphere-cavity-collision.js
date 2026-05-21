function clampNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  const n = clampNumber(value, min);
  return Math.max(min, Math.min(max, n));
}

function setVector3(target, x = 0, y = 0, z = 0) {
  target.x = x;
  target.y = y;
  target.z = z;
  return target;
}

function normalizeVector3(x = 0, y = 0, z = 0, fallback = { x: 0, y: -1, z: 0 }, target = null) {
  const dx = clampNumber(x, 0);
  const dy = clampNumber(y, 0);
  const dz = clampNumber(z, 0);
  const length = Math.hypot(dx, dy, dz);
  if (length <= 0.000001) {
    const xOut = clampNumber(fallback && fallback.x, 0);
    const yOut = clampNumber(fallback && fallback.y, -1);
    const zOut = clampNumber(fallback && fallback.z, 0);
    return target
      ? setVector3(target, xOut, yOut, zOut)
      : Object.freeze({ x: xOut, y: yOut, z: zOut });
  }
  const xOut = dx / length;
  const yOut = dy / length;
  const zOut = dz / length;
  return target
    ? setVector3(target, xOut, yOut, zOut)
    : Object.freeze({ x: xOut, y: yOut, z: zOut });
}

function resolveAuthoredSegmentNormal(segment = null, target = null) {
  if (!segment) return null;
  const nx = Number(segment.normalX);
  const ny = Number(segment.normalY);
  const length = Math.hypot(nx, ny);
  if (!Number.isFinite(nx) || !Number.isFinite(ny) || length <= 0.000001) return null;
  return target
    ? setVector3(target, nx / length, ny / length, 0)
    : Object.freeze({ x: nx / length, y: ny / length, z: 0 });
}

function closestPointOnSegment2D({
  pointXW = 0,
  pointYW = 0,
  segment = null,
  target = null,
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
    if (target) {
      target.xW = ax;
      target.yW = ay;
      target.t = 0;
      return target;
    }
    return Object.freeze({ xW: ax, yW: ay, t: 0 });
  }
  const apx = clampNumber(pointXW, 0) - ax;
  const apy = clampNumber(pointYW, 0) - ay;
  const t = clamp(((apx * abx) + (apy * aby)) / abLenSq, 0, 1);
  const xW = ax + (abx * t);
  const yW = ay + (aby * t);
  if (target) {
    target.xW = xW;
    target.yW = yW;
    target.t = t;
    return target;
  }
  return Object.freeze({ xW, yW, t });
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

const MODULE_SCRATCH = {
  defaultNormal: { x: 0, y: -1, z: 0 },
  aggregateFallback: { x: 0, y: -1, z: 0 },
  closestPoint: { xW: 0, yW: 0, t: 0 },
  normal: { x: 0, y: -1, z: 0 },
  fallbackNormal: { x: 0, y: -1, z: 0 },
  aggregateNormal: { x: 0, y: -1, z: 0 },
  response: {
    normalX: 0,
    normalY: -1,
    depth: 0,
    grounded: false,
    strongest: null,
  },
  hits: [],
};

function buildAggregateContactResponseInto(hits = [], target = MODULE_SCRATCH.response) {
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

  const fallback = MODULE_SCRATCH.aggregateFallback;
  fallback.x = strongest ? strongest.normalX : 0;
  fallback.y = strongest ? strongest.normalY : -1;
  fallback.z = 0;
  const aggregateNormal = normalizeVector3(
    sumNormalX,
    sumNormalY,
    0,
    fallback,
    MODULE_SCRATCH.aggregateNormal
  );

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

  target.normalX = aggregateNormal.x;
  target.normalY = aggregateNormal.y;
  target.depth = Math.max(requiredDepth, maxDepth);
  target.grounded = grounded;
  target.strongest = strongest;
  return target;
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
  target = null,
} = {}) {
  const safeRadius = Math.max(0, clampNumber(radiusW, 0));
  const safeBO = Math.max(1, clampNumber(boWorldUnits, 72));
  const safeDepthBO = Math.max(0, clampNumber(depthBO, 0));
  const closestXY = closestPointOnSegment2D({
    pointXW: sphereXW,
    pointYW: sphereYW,
    segment,
    target: target ? MODULE_SCRATCH.closestPoint : null,
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
  const authoredNormal = resolveAuthoredSegmentNormal(segment, target ? MODULE_SCRATCH.normal : null);
  if (authoredNormal) {
    normal = authoredNormal;
  } else if (distance > 0.000001) {
    normal = normalizeVector3(dx, dy, dz, MODULE_SCRATCH.defaultNormal, target ? MODULE_SCRATCH.normal : null);
  } else {
    const a = segment.a || {};
    const b = segment.b || {};
    const tangentX = clampNumber(b.xW, 0) - clampNumber(a.xW, 0);
    const tangentY = clampNumber(b.yW, 0) - clampNumber(a.yW, 0);
    const fallbackNormal = normalizeVector3(
      -tangentY,
      tangentX,
      0,
      MODULE_SCRATCH.defaultNormal,
      target ? MODULE_SCRATCH.fallbackNormal : null
    );
    const prevDx = Number.isFinite(Number(previousXW))
      ? (clampNumber(previousXW, 0) - clampNumber(closestXY.xW, 0))
      : fallbackNormal.x;
    const prevDy = Number.isFinite(Number(previousYW))
      ? (clampNumber(previousYW, 0) - clampNumber(closestXY.yW, 0))
      : fallbackNormal.y;
    if (((prevDx * fallbackNormal.x) + (prevDy * fallbackNormal.y)) >= 0) {
      normal = fallbackNormal;
    } else if (target) {
      normal = setVector3(MODULE_SCRATCH.normal, -fallbackNormal.x, -fallbackNormal.y, 0);
    } else {
      normal = Object.freeze({ x: -fallbackNormal.x, y: -fallbackNormal.y, z: 0 });
    }
  }

  const depth = Math.max(0, safeRadius - distance);
  if (depth <= 0) return null;
  const hit = target || {};
  hit.segmentId = String(segment.id || "");
  hit.pointXW = clampNumber(closestXY.xW, 0);
  hit.pointYW = clampNumber(closestXY.yW, 0);
  hit.pointZBO = closestDepthW / safeBO;
  hit.normalX = clampNumber(normal.x, 0);
  hit.normalY = clampNumber(normal.y, -1);
  hit.normalZ = clampNumber(normal.z, 0);
  hit.depth = depth;
  return target ? hit : Object.freeze({ ...hit });
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
  const hits = target && Array.isArray(target.hits) ? target.hits : MODULE_SCRATCH.hits;
  const hitPool = target && Array.isArray(target.hitPool) ? target.hitPool : null;
  let hitPoolCursor = 0;
  const safeRadius = Math.max(0, clampNumber(radiusW, 0));
  const safeSegments = Array.isArray(segments) ? segments : [];

  for (let iteration = 0; iteration < Math.max(1, clampNumber(maxIterations, 1)); iteration += 1) {
    hits.length = 0;
    for (const segment of safeSegments) {
      if (!segment) continue;
      const minX = clampNumber(segment.minXW, 0) - safeRadius;
      const maxX = clampNumber(segment.maxXW, 0) + safeRadius;
      const minY = clampNumber(segment.minYW, 0) - safeRadius;
      const maxY = clampNumber(segment.maxYW, 0) + safeRadius;
      if (resolvedXW < minX || resolvedXW > maxX || resolvedYW < minY || resolvedYW > maxY) continue;
      const hitTarget = hitPool
        ? (hitPool[hitPoolCursor] || (hitPool[hitPoolCursor] = {}))
        : null;
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
        target: hitTarget,
      });
      if (!hit) continue;
      if (hitPool) hitPoolCursor += 1;
      hits.push(hit);
    }
    if (!hits.length) break;
    const response = target
      ? buildAggregateContactResponseInto(hits, target.response || MODULE_SCRATCH.response)
      : buildAggregateContactResponse(hits);
    if (!response || response.depth <= 0) break;
    resolvedXW += response.normalX * response.depth;
    resolvedYW += response.normalY * response.depth;
    maxDepth = Math.max(maxDepth, response.depth);
    if (response.grounded) grounded = true;
    for (let i = 0; i < hits.length; i += 1) {
      contacts.push(hits[i]);
    }
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
