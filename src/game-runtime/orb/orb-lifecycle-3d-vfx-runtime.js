import * as THREE from "three";
import { createRng } from "./orb-lifecycle-vfx-runtime.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "./orb-lifecycle-3d-default.js";

const MAX_EROSION_CLUSTERS_PER_HIT = 12;
const MAX_EROSION_HOLES = 160;

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
    maxCracks: clampInt(source.maxCracks, 1, MAX_EROSION_CLUSTERS_PER_HIT, ORB_LIFECYCLE_3D_DEFAULTS.maxCracks),
    crackColor: Number(source.crackColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.crackColor,
    crackAlpha: clampNumber(source.crackAlpha, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha),
    crackWidthPx: clampNumber(source.crackWidthPx, 0.25, 12, ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx),
    crackLiftBO: clampNumber(source.crackLiftBO, 0, 0.2, ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO),
    edgeLightBrightness: clampNumber(source.edgeLightBrightness, 0, 3, ORB_LIFECYCLE_3D_DEFAULTS.edgeLightBrightness),
    edgeLightRange: clampNumber(source.edgeLightRange, 0.2, 6, ORB_LIFECYCLE_3D_DEFAULTS.edgeLightRange),
    holeEdgeSoftness: clampNumber(source.holeEdgeSoftness, 0.25, 8, ORB_LIFECYCLE_3D_DEFAULTS.holeEdgeSoftness),
    criticalGlow: clampNumber(source.criticalGlow, 0, 4, ORB_LIFECYCLE_3D_DEFAULTS.criticalGlow),
    energyColor: Number(source.energyColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.energyColor,
    startHoleSizeMin: clampNumber(source.startHoleSizeMin, 0.001, 0.08, ORB_LIFECYCLE_3D_DEFAULTS.startHoleSizeMin),
    startHoleSizeMax: clampNumber(source.startHoleSizeMax, 0.001, 0.12, ORB_LIFECYCLE_3D_DEFAULTS.startHoleSizeMax),
    childHoleCountMin: clampInt(source.childHoleCountMin, 0, 16, ORB_LIFECYCLE_3D_DEFAULTS.childHoleCountMin),
    childHoleCountMax: clampInt(source.childHoleCountMax, 0, 24, ORB_LIFECYCLE_3D_DEFAULTS.childHoleCountMax),
    childHoleSizeMin: clampNumber(source.childHoleSizeMin, 0.001, 0.08, ORB_LIFECYCLE_3D_DEFAULTS.childHoleSizeMin),
    childHoleSizeMax: clampNumber(source.childHoleSizeMax, 0.001, 0.12, ORB_LIFECYCLE_3D_DEFAULTS.childHoleSizeMax),
    childHoleRangeMin: clampNumber(source.childHoleRangeMin, 0.001, 0.5, ORB_LIFECYCLE_3D_DEFAULTS.childHoleRangeMin),
    childHoleRangeMax: clampNumber(source.childHoleRangeMax, 0.001, 0.8, ORB_LIFECYCLE_3D_DEFAULTS.childHoleRangeMax),
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

function tangentForNormal(normal, rng) {
  const reference = Math.abs(normal.y) < 0.86 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const angle = rng() * Math.PI * 2;
  return tangent.multiplyScalar(Math.cos(angle)).add(bitangent.multiplyScalar(Math.sin(angle))).normalize();
}

function randomFrontFaceVector(rng) {
  const theta = rng() * Math.PI * 2;
  const z = 0.12 + (rng() * 0.88);
  const r = Math.sqrt(Math.max(0, 1 - (z * z)));
  return new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z).normalize();
}

function createErosionUniforms(holes) {
  return holes.reduce((uniforms, hole, index) => {
    uniforms[`uHole${index}`] = { value: hole };
    return uniforms;
  }, {});
}

function buildErosionLines(holes) {
  const lines = [];
  holes.forEach((hole, index) => {
    lines.push(
      `        float d${index} = 1.0 - dot(n, normalize(uHole${index}.xyz));`,
      `        float r${index} = uHole${index}.w * uErosionGrowth;`,
      `        float edge${index} = max(0.0006, fwidth(d${index}) * uHoleEdgeSoftness);`,
      `        float aura${index} = max(0.004, r${index} * uEdgeLightRange);`,
      `        float void${index} = 1.0 - smoothstep(r${index}, r${index} + edge${index}, d${index});`,
      `        float outside${index} = smoothstep(r${index} - edge${index}, r${index} + edge${index} * 2.0, d${index});`,
      `        float stress${index} = outside${index} * (1.0 - smoothstep(r${index}, r${index} + aura${index}, d${index}));`,
      `        erosion = max(erosion, void${index});`,
      `        edgeStress = max(edgeStress, stress${index});`
    );
  });
  return lines.join("\n");
}

function rangeValue(rng, min, max) {
  const a = Number(min) || 0;
  const b = Number(max) || a;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo + (rng() * (hi - lo));
}

function rangeInt(rng, min, max) {
  return Math.round(rangeValue(rng, min, max));
}

function createErosionHoles(seed = 1, clusterCount = 1, config = ORB_LIFECYCLE_3D_DEFAULTS) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const rng = createRng((Number(seed) || 1) ^ 0x3e80510);
  const clusters = Math.max(1, Math.round(Number(clusterCount) || 1));
  const holes = [];
  for (let cluster = 0; cluster < clusters && holes.length < MAX_EROSION_HOLES; cluster += 1) {
    const center = randomFrontFaceVector(rng);
    const tangent = tangentForNormal(center, rng);
    const bitangent = new THREE.Vector3().crossVectors(center, tangent).normalize();
    const baseRadius = rangeValue(rng, resolved.startHoleSizeMin, resolved.startHoleSizeMax);
    holes.push(new THREE.Vector4(center.x, center.y, center.z, baseRadius * 1.28));
    const childCount = Math.max(0, rangeInt(rng, resolved.childHoleCountMin, resolved.childHoleCountMax));
    for (let satellite = 0; satellite < childCount && holes.length < MAX_EROSION_HOLES; satellite += 1) {
      const angle = rng() * Math.PI * 2;
      const offset = rangeValue(rng, resolved.childHoleRangeMin, resolved.childHoleRangeMax);
      const direction = tangent.clone()
        .multiplyScalar(Math.cos(angle) * offset)
        .add(bitangent.clone().multiplyScalar(Math.sin(angle) * offset));
      const satelliteCenter = center.clone().add(direction).normalize();
      const satelliteRadius = rangeValue(rng, resolved.childHoleSizeMin, resolved.childHoleSizeMax);
      holes.push(new THREE.Vector4(satelliteCenter.x, satelliteCenter.y, satelliteCenter.z, satelliteRadius));
    }
  }
  return holes;
}

function activeClusterCount({
  hitsTaken = 0,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const hits = clampInt(hitsTaken, 0, 99, 0);
  return Math.max(0, Math.min(MAX_EROSION_HOLES, hits * resolved.maxCracks));
}

export function createOrbLifecycle3dErosionPatch({
  hitsTaken = 0,
  maxHits = 3,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const hits = clampInt(hitsTaken, 0, 99, 0);
  const total = Math.max(1, clampInt(maxHits, 1, 99, resolved.maxHits));
  const hitRatio = Math.max(0, Math.min(1, hits / total));
  const activeClusters = activeClusterCount({ hitsTaken: hits, config: resolved });
  if (hits <= 0 || activeClusters <= 0) return null;
  const holes = createErosionHoles(seed, activeClusters, resolved);

  return Object.freeze({
    holes,
    uniforms: {
      uErosionGrowth: { value: 0.82 + (hitRatio * 0.65) },
      uErosionOpacity: { value: resolved.crackAlpha },
      uEdgeLightBrightness: { value: resolved.edgeLightBrightness },
      uEdgeLightRange: { value: resolved.edgeLightRange },
      uHoleEdgeSoftness: { value: resolved.holeEdgeSoftness },
      ...createErosionUniforms(holes),
    },
    uniformsSource: `
      uniform float uErosionGrowth;
      uniform float uErosionOpacity;
      uniform float uEdgeLightBrightness;
      uniform float uEdgeLightRange;
      uniform float uHoleEdgeSoftness;
      ${holes.map((hole, index) => `uniform vec4 uHole${index};`).join("\n      ")}
    `,
    fragmentSource: `
        vec3 n = normalize(vLifecycleLocalNormal);
        float erosion = 0.0;
        float edgeStress = 0.0;
${buildErosionLines(holes)}
        float edgeLight = smoothstep(0.0, 0.7, uErosionOpacity) * edgeStress * uEdgeLightBrightness;
        pearl += (pearl * 0.16 + vec3(0.08, 0.11, 0.12)) * edgeLight;
        if (erosion * uErosionOpacity > 0.5) discard;
    `,
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
  void bo;
  void hitsTaken;
  void maxHits;
  void seed;
  void resolved;
  const group = new THREE.Group();
  group.name = "orb_lifecycle3d:cracks";
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
