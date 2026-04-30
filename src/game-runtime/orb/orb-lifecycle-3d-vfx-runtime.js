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

function randomUnitVector(rng) {
  const theta = rng() * Math.PI * 2;
  const z = (rng() * 2) - 1;
  const radial = Math.sqrt(Math.max(0, 1 - (z * z)));
  return new THREE.Vector3(
    Math.cos(theta) * radial,
    Math.sin(theta) * radial,
    z
  );
}

function tangentFor(normal, angle) {
  const helper = Math.abs(normal.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, helper).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return tangent.multiplyScalar(Math.cos(angle)).add(bitangent.multiplyScalar(Math.sin(angle))).normalize();
}

function buildSurfaceCrawlPath({
  rng,
  radius,
  lift,
  startNormal,
  steps,
  stepRadians,
  curl,
} = {}) {
  const points = [];
  let normal = startNormal.clone().normalize();
  let direction = tangentFor(normal, rng() * Math.PI * 2);
  for (let i = 0; i < steps; i += 1) {
    points.push(normal.clone().multiplyScalar(radius + lift));
    const turn = (rng() - 0.5) * curl;
    direction.applyAxisAngle(normal, turn).normalize();
    const axis = new THREE.Vector3().crossVectors(normal, direction).normalize();
    if (axis.lengthSq() > 0.0001) {
      normal.applyAxisAngle(axis, stepRadians * (0.55 + rng() * 0.75)).normalize();
    }
    direction.projectOnPlane(normal).normalize();
    if (direction.lengthSq() < 0.0001) direction = tangentFor(normal, rng() * Math.PI * 2);
  }
  return points;
}

function createVeinMesh(points, {
  radius = 0.1,
  color = 0xffffff,
  opacity = 1,
  emissive = 0x000000,
  additive = false,
  name = "vein",
} = {}) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
  const geometry = new THREE.TubeGeometry(curve, Math.max(6, points.length * 4), Math.max(0.01, radius), 6, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
    depthTest: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  if (material.color && emissive) material.color.lerp(new THREE.Color(emissive), 0.08);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function createOffsetSurfacePath(points, side = 1, offset = 0, radius = 1, lift = 0) {
  if (!Array.isArray(points) || points.length < 2) return points;
  const surfaceRadius = Math.max(1, radius + lift);
  const angularOffset = offset / surfaceRadius;
  return points.map((point, index) => {
    const prev = points[Math.max(0, index - 1)] || point;
    const next = points[Math.min(points.length - 1, index + 1)] || point;
    const normal = point.clone().normalize();
    const forward = next.clone().sub(prev).projectOnPlane(normal).normalize();
    const lateral = new THREE.Vector3().crossVectors(normal, forward).normalize();
    if (lateral.lengthSq() < 0.0001) return normal.multiplyScalar(radius + lift);
    return normal.add(lateral.multiplyScalar(side * angularOffset)).normalize().multiplyScalar(surfaceRadius);
  });
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
  const veinCount = Math.max(1, Math.min(16, Math.ceil(crackCount / 4)));
  const baseWidth = Math.max(0.04, radius * 0.006 * resolved.crackWidthPx);
  const coreColor = new THREE.Color(resolved.crackColor);
  const darkColor = new THREE.Color(0x05070a).lerp(coreColor, 0.18).getHex();
  const glowColor = coreColor.getHex();
  const rimCoolColor = coreColor.clone().lerp(new THREE.Color(0x63fff1), 0.42).getHex();
  const rimWarmColor = coreColor.clone().lerp(new THREE.Color(0xff80da), 0.28).getHex();

  for (let i = 0; i < veinCount; i += 1) {
    const startNormal = randomUnitVector(rng);
    const steps = Math.max(4, Math.min(11, Math.round(4 + (ratio * 5) + (rng() * 3))));
    const path = buildSurfaceCrawlPath({
      rng,
      radius,
      lift,
      startNormal,
      steps,
      stepRadians: 0.09 + (ratio * 0.055),
      curl: 1.35 + (ratio * 0.9),
    });
    const rimOffset = baseWidth * 1.65;
    const leftRimPath = createOffsetSurfacePath(path, -1, rimOffset, radius, lift + (baseWidth * 0.34));
    const rightRimPath = createOffsetSurfacePath(path, 1, rimOffset, radius, lift + (baseWidth * 0.34));
    const underlay = createVeinMesh(path, {
      radius: baseWidth * 3.15,
      color: darkColor,
      opacity: Math.min(0.96, 0.68 + (ratio * 0.22)),
      name: "orb_lifecycle3d:vein_underlay",
    });
    const leftRim = createVeinMesh(leftRimPath, {
      radius: baseWidth * 0.72,
      color: rimCoolColor,
      opacity: Math.max(0, Math.min(0.84, resolved.crackAlpha * 0.92 * glow)),
      additive: true,
      name: "orb_lifecycle3d:vein_rim_cool",
    });
    const rightRim = createVeinMesh(rightRimPath, {
      radius: baseWidth * 0.58,
      color: rimWarmColor,
      opacity: Math.max(0, Math.min(0.68, resolved.crackAlpha * 0.72 * glow)),
      additive: true,
      name: "orb_lifecycle3d:vein_rim_warm",
    });
    const core = createVeinMesh(path, {
      radius: baseWidth * 0.82,
      color: glowColor,
      opacity: Math.max(0, Math.min(1, resolved.crackAlpha * glow)),
      additive: true,
      name: "orb_lifecycle3d:vein_core",
    });
    const halo = createVeinMesh(path, {
      radius: baseWidth * 4.2,
      color: glowColor,
      opacity: Math.max(0, Math.min(0.42, resolved.crackAlpha * 0.26 * glow)),
      additive: true,
      name: "orb_lifecycle3d:vein_halo",
    });
    if (underlay) group.add(underlay);
    if (halo) group.add(halo);
    if (leftRim) group.add(leftRim);
    if (rightRim) group.add(rightRim);
    if (core) group.add(core);

    if (ratio >= 0.45 && rng() > 0.35) {
      const branchStart = path[Math.max(1, Math.floor(path.length * (0.35 + rng() * 0.35)))] || path[1];
      const branchPath = buildSurfaceCrawlPath({
        rng,
        radius,
        lift,
        startNormal: branchStart.clone().normalize(),
        steps: Math.max(3, Math.round(3 + (ratio * 3))),
        stepRadians: 0.065 + (ratio * 0.04),
        curl: 1.8,
      });
      const branch = createVeinMesh(branchPath, {
        radius: baseWidth * 0.76,
        color: glowColor,
        opacity: Math.max(0, Math.min(0.86, resolved.crackAlpha * 0.82 * glow)),
        additive: true,
        name: "orb_lifecycle3d:vein_branch",
      });
      if (branch) group.add(branch);
    }
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
