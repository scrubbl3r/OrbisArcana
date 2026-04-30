import * as THREE from "three";
import { createRng } from "./orb-lifecycle-vfx-runtime.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "./orb-lifecycle-3d-default.js";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, safe));
}

function clampInt(value, min, max, fallback) {
  return Math.round(clampNumber(value, min, max, fallback));
}

export function resolveOrbLifecycle3dConfig(config = ORB_LIFECYCLE_3D_DEFAULTS) {
  const source = config && typeof config === "object" ? config : ORB_LIFECYCLE_3D_DEFAULTS;
  return Object.freeze({
    maxHits: clampInt(source.maxHits, 1, 12, ORB_LIFECYCLE_3D_DEFAULTS.maxHits),
    maxCracks: clampInt(source.maxCracks, 3, 96, ORB_LIFECYCLE_3D_DEFAULTS.maxCracks),
    crackColor: Number(source.crackColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.crackColor,
    crackAlpha: clampNumber(source.crackAlpha, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha),
    crackWidthPx: clampNumber(source.crackWidthPx, 0.25, 12, ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx),
    crackLiftBO: clampNumber(source.crackLiftBO, 0, 0.2, ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO),
    criticalGlow: clampNumber(source.criticalGlow, 0, 4, ORB_LIFECYCLE_3D_DEFAULTS.criticalGlow),
    particleCount: clampInt(source.particleCount, 0, 512, ORB_LIFECYCLE_3D_DEFAULTS.particleCount),
    particleColor: Number(source.particleColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.particleColor,
    particleSizePx: clampNumber(source.particleSizePx, 0.5, 32, ORB_LIFECYCLE_3D_DEFAULTS.particleSizePx),
    particleSpeedMinBO: clampNumber(source.particleSpeedMinBO, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMinBO),
    particleSpeedMaxBO: clampNumber(source.particleSpeedMaxBO, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMaxBO),
    particleDrag: clampNumber(source.particleDrag, 0, 12, ORB_LIFECYCLE_3D_DEFAULTS.particleDrag),
    particleTtlMs: clampNumber(source.particleTtlMs, 80, 6000, ORB_LIFECYCLE_3D_DEFAULTS.particleTtlMs),
  });
}

function createCrackTube(points, {
  radius = 0.1,
  color = 0xffffff,
  opacity = 1,
  additive = false,
  name = "crack",
} = {}) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.08);
  const geometry = new THREE.TubeGeometry(curve, Math.max(6, points.length * 4), Math.max(0.01, radius), 6, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    depthTest: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function createSphereSeeds(rng, count) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const yaw = rng() * Math.PI * 2;
  const pitch = (rng() - 0.5) * 0.5;
  const roll = (rng() - 0.5) * 0.5;
  const rotation = new THREE.Euler(pitch, yaw, roll, "YXZ");
  for (let i = 0; i < count; i += 1) {
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(Math.max(0, 1 - (y * y)));
    const theta = (i * goldenAngle) + ((rng() - 0.5) * 0.22);
    const point = new THREE.Vector3(
      Math.cos(theta) * r,
      y,
      Math.sin(theta) * r
    );
    points.push(point.applyEuler(rotation).normalize());
  }
  return points;
}

function triangleKey(a, b, c) {
  return [a, b, c].sort((x, y) => x - y).join(":");
}

function pairKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildSphericalDelaunayFaces(points) {
  const faces = [];
  const seen = new Set();
  const eps = 1e-6;
  for (let i = 0; i < points.length - 2; i += 1) {
    for (let j = i + 1; j < points.length - 1; j += 1) {
      for (let k = j + 1; k < points.length; k += 1) {
        const a = points[i];
        const b = points[j];
        const c = points[k];
        const normal = new THREE.Vector3().crossVectors(
          b.clone().sub(a),
          c.clone().sub(a)
        );
        if (normal.lengthSq() < eps) continue;
        let positive = false;
        let negative = false;
        for (let n = 0; n < points.length; n += 1) {
          if (n === i || n === j || n === k) continue;
          const side = normal.dot(points[n].clone().sub(a));
          if (side > eps) positive = true;
          if (side < -eps) negative = true;
          if (positive && negative) break;
        }
        if (positive && negative) continue;
        const key = triangleKey(i, j, k);
        if (seen.has(key)) continue;
        seen.add(key);
        const center = normal.normalize();
        const centroid = a.clone().add(b).add(c).normalize();
        if (center.dot(centroid) < 0) center.multiplyScalar(-1);
        faces.push(Object.freeze({ ids: Object.freeze([i, j, k]), center }));
      }
    }
  }
  return faces;
}

function slerpUnit(a, b, t) {
  const dot = Math.max(-1, Math.min(1, a.dot(b)));
  const theta = Math.acos(dot);
  if (theta < 0.0001) return a.clone();
  const sinTheta = Math.sin(theta);
  return a.clone().multiplyScalar(Math.sin((1 - t) * theta) / sinTheta)
    .add(b.clone().multiplyScalar(Math.sin(t * theta) / sinTheta))
    .normalize();
}

function createGeodesicArc(a, b, radius, detail = 10) {
  const dot = Math.max(-1, Math.min(1, a.dot(b)));
  if (dot < -0.96 || dot > 0.9998) return null;
  const steps = Math.max(3, Math.round(detail * Math.acos(dot)));
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push(slerpUnit(a, b, i / steps).multiplyScalar(radius));
  }
  return points;
}

function createSphericalVoronoiArcs(seedPoints, radius) {
  const faces = buildSphericalDelaunayFaces(seedPoints);
  const adjacentFacesByEdge = new Map();
  faces.forEach((face, faceIndex) => {
    const [a, b, c] = face.ids;
    for (const key of [pairKey(a, b), pairKey(b, c), pairKey(c, a)]) {
      const adjacent = adjacentFacesByEdge.get(key) || [];
      adjacent.push(faceIndex);
      adjacentFacesByEdge.set(key, adjacent);
    }
  });

  const arcs = [];
  for (const [key, faceIndexes] of adjacentFacesByEdge.entries()) {
    if (faceIndexes.length !== 2) continue;
    const a = faces[faceIndexes[0]].center;
    const b = faces[faceIndexes[1]].center;
    const points = createGeodesicArc(a, b, radius, 13);
    if (!points) continue;
    const [seedA, seedB] = key.split(":").map((value) => Number(value));
    const midpoint = points[Math.floor(points.length * 0.5)].clone().normalize();
    const score = midpoint.z + (midpoint.x * 0.18) + (midpoint.y * 0.08);
    arcs.push(Object.freeze({ points, score, seedA, seedB }));
  }

  return arcs.sort((a, b) => b.score - a.score || a.seedA - b.seedA || a.seedB - b.seedB);
}

export function createOrbLifecycle3dCracks({
  bo = 72,
  hitsTaken = 0,
  maxHits = 3,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const hits = clampInt(hitsTaken, 0, 99, 0);
  const total = Math.max(1, clampInt(maxHits, 1, 99, resolved.maxHits));
  const crackCount = hits <= 0
    ? 0
    : Math.max(2, Math.min(resolved.maxCracks, Math.round((hits / total) * resolved.maxCracks)));
  const group = new THREE.Group();
  group.name = "orb_lifecycle3d:cracks";
  if (crackCount <= 0) return group;

  const radius = Math.max(1, Number(bo) || 72) * 0.5;
  const lift = Math.max(0, Number(resolved.crackLiftBO) || 0) * Math.max(1, Number(bo) || 72);
  const rng = createRng(seed || 1);
  const ratio = Math.max(0, Math.min(1, hits / total));
  const glow = 1 + (ratio * Math.max(0, resolved.criticalGlow - 1));
  const surfaceRadius = radius + lift;
  const seedCount = Math.max(8, Math.min(30, Math.round(8 + (resolved.maxCracks * 0.55))));
  const visibleArcCount = Math.max(3, Math.min(72, Math.round(crackCount * 2.35)));
  const baseWidth = Math.max(0.025, radius * 0.0032 * resolved.crackWidthPx);
  const coreColor = new THREE.Color(resolved.crackColor);
  const darkColor = new THREE.Color(0x010204).lerp(coreColor, 0.08).getHex();
  const glowColor = coreColor.getHex();

  const seedPoints = createSphereSeeds(rng, seedCount);
  const arcs = createSphericalVoronoiArcs(seedPoints, surfaceRadius);
  for (const arc of arcs.slice(0, visibleArcCount)) {
    const groove = createCrackTube(arc.points, {
      radius: baseWidth * 2.8,
      color: darkColor,
      opacity: Math.min(0.86, 0.46 + (ratio * 0.26)),
      name: "orb_lifecycle3d:voronoi_groove",
    });
    const rim = createCrackTube(arc.points, {
      radius: baseWidth * 1.18,
      color: glowColor,
      opacity: Math.max(0, Math.min(0.72, resolved.crackAlpha * 0.72 * glow)),
      additive: true,
      name: "orb_lifecycle3d:voronoi_rim",
    });
    const halo = createCrackTube(arc.points, {
      radius: baseWidth * 4.1,
      color: glowColor,
      opacity: Math.max(0, Math.min(0.26, resolved.crackAlpha * 0.14 * glow)),
      additive: true,
      name: "orb_lifecycle3d:voronoi_halo",
    });
    if (groove) group.add(groove);
    if (halo) group.add(halo);
    if (rim) group.add(rim);
  }
  return group;
}

export function createOrbLifecycle3dDissolveBurst({
  bo = 72,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
  nowMs = performance.now(),
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const count = Math.max(0, resolved.particleCount);
  const baseOrb = Math.max(1, Number(bo) || 72);
  const radius = baseOrb * 0.5;
  const rng = createRng(seed || 1);
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const theta = rng() * Math.PI * 2;
    const z = (rng() * 2) - 1;
    const radial = Math.sqrt(Math.max(0, 1 - (z * z)));
    const nx = Math.cos(theta) * radial;
    const ny = Math.sin(theta) * radial;
    const nz = z;
    const speed = baseOrb * (
      resolved.particleSpeedMinBO +
      (rng() * Math.max(0, resolved.particleSpeedMaxBO - resolved.particleSpeedMinBO))
    );
    const index = i * 3;
    positions[index] = nx * radius * (0.78 + (rng() * 0.22));
    positions[index + 1] = ny * radius * (0.78 + (rng() * 0.22));
    positions[index + 2] = nz * radius * (0.78 + (rng() * 0.22));
    velocities[index] = nx * speed;
    velocities[index + 1] = ny * speed;
    velocities[index + 2] = nz * speed;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: resolved.particleColor,
    size: resolved.particleSizePx,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "orb_lifecycle3d:dissolve_burst";
  points.userData.lifecycle3d = {
    bornAtMs: Number(nowMs) || performance.now(),
    lastAtMs: Number(nowMs) || performance.now(),
    ttlMs: resolved.particleTtlMs,
    drag: resolved.particleDrag,
    velocities,
  };
  return points;
}

export function updateOrbLifecycle3dDissolveBurst(points, nowMs = performance.now()) {
  if (!points || !points.geometry || !points.material || !points.userData) return false;
  const data = points.userData.lifecycle3d || {};
  const bornAtMs = Number(data.bornAtMs) || nowMs;
  const lastAtMs = Number(data.lastAtMs) || bornAtMs;
  const ttlMs = Math.max(1, Number(data.ttlMs) || 1);
  const age = Math.max(0, nowMs - bornAtMs);
  const t = Math.max(0, Math.min(1, age / ttlMs));
  const dt = Math.max(0.001, Math.min(0.05, (nowMs - lastAtMs) / 1000));
  const drag = Math.max(0, Number(data.drag) || 0);
  const velocities = data.velocities;
  const position = points.geometry.getAttribute("position");
  if (!position || !velocities) return false;
  const damp = Math.exp(-drag * dt);
  for (let i = 0; i < position.count; i += 1) {
    const index = i * 3;
    velocities[index] *= damp;
    velocities[index + 1] *= damp;
    velocities[index + 2] *= damp;
    position.array[index] += velocities[index] * dt;
    position.array[index + 1] += velocities[index + 1] * dt;
    position.array[index + 2] += velocities[index + 2] * dt;
  }
  position.needsUpdate = true;
  points.material.opacity = Math.max(0, 1 - (t * t));
  points.scale.setScalar(1 + (t * 0.45));
  data.lastAtMs = nowMs;
  return t < 1;
}
