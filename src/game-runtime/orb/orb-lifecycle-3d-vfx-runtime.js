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

function smoothstep01(value) {
  const t = Math.max(0, Math.min(1, Number(value) || 0));
  return t * t * (3 - (2 * t));
}

export function resolveOrbLifecycle3dConfig(config = ORB_LIFECYCLE_3D_DEFAULTS) {
  const source = config && typeof config === "object" ? config : ORB_LIFECYCLE_3D_DEFAULTS;
  return Object.freeze({
    maxHits: clampInt(source.maxHits, 1, 12, ORB_LIFECYCLE_3D_DEFAULTS.maxHits),
    maxCracks: clampInt(source.maxCracks, 1, 12, ORB_LIFECYCLE_3D_DEFAULTS.maxCracks),
    crackColor: Number(source.crackColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.crackColor,
    crackAlpha: clampNumber(source.crackAlpha, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha),
    crackWidthPx: clampNumber(source.crackWidthPx, 0.25, 12, ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx),
    crackLiftBO: clampNumber(source.crackLiftBO, 0, 0.2, ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO),
    criticalGlow: clampNumber(source.criticalGlow, 0, 4, ORB_LIFECYCLE_3D_DEFAULTS.criticalGlow),
    energyColor: Number(source.energyColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.energyColor,
    mutationSpeed: clampNumber(source.mutationSpeed, 0, Infinity, ORB_LIFECYCLE_3D_DEFAULTS.mutationSpeed),
    mutationAmount: clampNumber(source.mutationAmount, 0, Infinity, ORB_LIFECYCLE_3D_DEFAULTS.mutationAmount),
    diffuseWash: clampNumber(source.diffuseWash, 0, 2, ORB_LIFECYCLE_3D_DEFAULTS.diffuseWash),
    edgeBrightness: clampNumber(source.edgeBrightness, 0, 3, ORB_LIFECYCLE_3D_DEFAULTS.edgeBrightness),
    cellDarkness: clampNumber(source.cellDarkness, 0, 2, ORB_LIFECYCLE_3D_DEFAULTS.cellDarkness),
    cellSharpness: clampNumber(source.cellSharpness, 0, 3, ORB_LIFECYCLE_3D_DEFAULTS.cellSharpness),
    detailEmergence: clampNumber(source.detailEmergence, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.detailEmergence),
    particleCount: clampInt(source.particleCount, 0, 512, ORB_LIFECYCLE_3D_DEFAULTS.particleCount),
    particleColor: Number(source.particleColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.particleColor,
    particleSizePx: clampNumber(source.particleSizePx, 0.5, 32, ORB_LIFECYCLE_3D_DEFAULTS.particleSizePx),
    particleSpeedMinBO: clampNumber(source.particleSpeedMinBO, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMinBO),
    particleSpeedMaxBO: clampNumber(source.particleSpeedMaxBO, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.particleSpeedMaxBO),
    particleDrag: clampNumber(source.particleDrag, 0, 12, ORB_LIFECYCLE_3D_DEFAULTS.particleDrag),
    particleTtlMs: clampNumber(source.particleTtlMs, 80, 6000, ORB_LIFECYCLE_3D_DEFAULTS.particleTtlMs),
  });
}

function randomUnitVector(rng) {
  const theta = rng() * Math.PI * 2;
  const z = (rng() * 2) - 1;
  const r = Math.sqrt(Math.max(0, 1 - (z * z)));
  return new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z).normalize();
}

function tangentForNormal(normal, rng) {
  const reference = Math.abs(normal.y) < 0.86 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const angle = rng() * Math.PI * 2;
  return tangent.multiplyScalar(Math.cos(angle)).add(bitangent.multiplyScalar(Math.sin(angle))).normalize();
}

function stepOnSphere(normal, tangent, stepAngle, bend) {
  const next = normal.clone()
    .multiplyScalar(Math.cos(stepAngle))
    .add(tangent.clone().multiplyScalar(Math.sin(stepAngle)))
    .normalize();
  const newTangent = tangent.clone().add(normal.clone().multiplyScalar(-tangent.dot(normal))).normalize();
  const turnAxis = next.clone();
  newTangent.applyAxisAngle(turnAxis, bend).add(next.clone().multiplyScalar(-newTangent.dot(next))).normalize();
  return { normal: next, tangent: newTangent };
}

function buildJaggedCrackPath({
  rng,
  radius,
  lift,
  routeIndex = 0,
  routeProgress = 1,
  branch = false,
  startNormal = null,
} = {}) {
  const pointCount = branch ? 7 : 13;
  const reveal = smoothstep01(routeProgress);
  const visibleCount = Math.max(2, Math.ceil(pointCount * reveal));
  const arc = (branch ? 0.34 : 0.72) * (0.82 + (rng() * 0.36));
  let normal = startNormal && typeof startNormal.clone === "function" ? startNormal.clone().normalize() : randomUnitVector(rng);
  if (!branch && !startNormal && normal.z < -0.2) normal.z = Math.abs(normal.z);
  normal.normalize();
  let tangent = tangentForNormal(normal, rng);
  const path = [normal.clone().multiplyScalar(radius + lift)];

  for (let i = 1; i < visibleCount; i += 1) {
    const jag = (rng() - 0.5) * (branch ? 0.92 : 0.68);
    const drift = Math.sin((routeIndex + 1) * 1.7 + i * 0.9) * 0.16;
    const stepped = stepOnSphere(normal, tangent, arc / (pointCount - 1), jag + drift);
    normal = stepped.normal;
    tangent = stepped.tangent;
    path.push(normal.clone().multiplyScalar(radius + lift));
  }

  return path;
}

function createCrackSegments(points, radius, material, name) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const group = new THREE.Group();
  group.name = name;
  group.renderOrder = 12;
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion();
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const length = a.distanceTo(b);
    if (length <= 0.0001) continue;
    const direction = b.clone().sub(a).normalize();
    const geometry = new THREE.CylinderGeometry(
      Math.max(0.025, radius),
      Math.max(0.025, radius),
      length,
      5,
      1,
      false
    );
    const segment = new THREE.Mesh(geometry, material);
    segment.name = `${name}:segment`;
    segment.position.copy(a).add(b).multiplyScalar(0.5);
    quat.setFromUnitVectors(up, direction);
    segment.quaternion.copy(quat);
    segment.renderOrder = 12;
    group.add(segment);
  }
  return group.children.length > 0 ? group : null;
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
  const ratio = Math.max(0, Math.min(1, hits / total));
  const routeCount = hits <= 0 ? 0 : Math.max(1, Math.min(resolved.maxCracks, Math.ceil(ratio * resolved.maxCracks)));
  const group = new THREE.Group();
  group.name = "orb_lifecycle3d:cracks";
  if (routeCount <= 0) return group;

  const radius = Math.max(1, Number(bo) || 72) * 0.5;
  const lift = Math.max(0.002, Number(resolved.crackLiftBO) || 0.006) * Math.max(1, Number(bo) || 72);
  const rng = createRng((Number(seed) || 1) ^ 0x51f15e);
  const crackWidth = Math.max(0.035, Number(resolved.crackWidthPx) || 1.35) * Math.max(1, Number(bo) || 72) * 0.0028;
  const troughMaterial = new THREE.MeshBasicMaterial({
    color: resolved.energyColor,
    transparent: true,
    opacity: Math.max(0.08, Math.min(0.95, resolved.crackAlpha * 0.68)),
    depthWrite: false,
    depthTest: true,
  });
  const edgeMaterial = new THREE.MeshBasicMaterial({
    color: resolved.crackColor,
    transparent: true,
    opacity: Math.max(0.05, Math.min(1, resolved.crackAlpha * (0.55 + (ratio * 0.25)))),
    depthWrite: false,
    depthTest: true,
  });

  for (let i = 0; i < routeCount; i += 1) {
    const routeProgress = Math.max(0, Math.min(1, (ratio * resolved.maxCracks) - i));
    if (routeProgress <= 0) continue;
    const path = buildJaggedCrackPath({ rng, radius, lift, routeIndex: i, routeProgress });
    const trough = createCrackSegments(path, crackWidth * 2.35, troughMaterial, "orb_lifecycle3d:crack_trough");
    const edge = createCrackSegments(path, crackWidth, edgeMaterial, "orb_lifecycle3d:crack_edge");
    if (trough) group.add(trough);
    if (edge) group.add(edge);

    if (routeProgress > 0.48 && (i + hits) % 2 === 0) {
      const branch = buildJaggedCrackPath({
        rng,
        radius,
        lift: lift * 1.04,
        routeIndex: i + 13,
        routeProgress: Math.min(1, (routeProgress - 0.32) / 0.68),
        branch: true,
        startNormal: path[Math.max(1, Math.floor(path.length * 0.55))].clone().normalize(),
      });
      const branchMesh = createCrackSegments(branch, crackWidth * 0.72, edgeMaterial, "orb_lifecycle3d:crack_branch");
      if (branchMesh) group.add(branchMesh);
    }
  }

  return group;
}

export function updateOrbLifecycle3dCracks(cracks, nowMs = performance.now()) {
  void cracks;
  void nowMs;
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
