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
    maxHits: clampInt(source.maxHits, 1, 1000, ORB_LIFECYCLE_3D_DEFAULTS.maxHits),
    erosionSeed: clampInt(source.erosionSeed, 1, 999999999, ORB_LIFECYCLE_3D_DEFAULTS.erosionSeed),
    crackColor: Number(source.crackColor) >>> 0 || ORB_LIFECYCLE_3D_DEFAULTS.crackColor,
    crackAlpha: clampNumber(source.crackAlpha, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.crackAlpha),
    crackWidthPx: clampNumber(source.crackWidthPx, 0.25, 12, ORB_LIFECYCLE_3D_DEFAULTS.crackWidthPx),
    crackLiftBO: clampNumber(source.crackLiftBO, 0, 0.2, ORB_LIFECYCLE_3D_DEFAULTS.crackLiftBO),
    noiseScale: clampNumber(source.noiseScale, 0.1, 24, ORB_LIFECYCLE_3D_DEFAULTS.noiseScale),
    noiseContrast: clampNumber(source.noiseContrast, 0.05, 3, ORB_LIFECYCLE_3D_DEFAULTS.noiseContrast),
    noiseOctaves: clampInt(source.noiseOctaves, 1, 8, ORB_LIFECYCLE_3D_DEFAULTS.noiseOctaves),
    noiseLacunarity: clampNumber(source.noiseLacunarity, 1.05, 4, ORB_LIFECYCLE_3D_DEFAULTS.noiseLacunarity),
    noiseGain: clampNumber(source.noiseGain, 0.05, 0.95, ORB_LIFECYCLE_3D_DEFAULTS.noiseGain),
    detailScale: clampNumber(source.detailScale, 0.1, 48, ORB_LIFECYCLE_3D_DEFAULTS.detailScale),
    detailAmount: clampNumber(source.detailAmount, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.detailAmount),
    coverageStart: clampNumber(source.coverageStart, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.coverageStart),
    coverageEnd: clampNumber(source.coverageEnd, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.coverageEnd),
    growthCurve: clampNumber(source.growthCurve, 0.1, 5, ORB_LIFECYCLE_3D_DEFAULTS.growthCurve),
    edgeLightBrightness: clampNumber(source.edgeLightBrightness, 0, 1, ORB_LIFECYCLE_3D_DEFAULTS.edgeLightBrightness),
    edgeLightRange: clampNumber(source.edgeLightRange, 0.2, 24, ORB_LIFECYCLE_3D_DEFAULTS.edgeLightRange),
    holeEdgeSoftness: clampNumber(source.holeEdgeSoftness, 0, 8, ORB_LIFECYCLE_3D_DEFAULTS.holeEdgeSoftness),
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

export function createOrbLifecycle3dErosionPatch({
  hitsTaken = 0,
  maxHits = 3,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const hits = clampInt(hitsTaken, 0, 1000, 0);
  const total = Math.max(1, clampInt(maxHits, 1, 1000, resolved.maxHits));
  const hitRatio = Math.max(0, Math.min(1, hits / total));
  if (hits <= 0 || hitRatio <= 0) return null;
  const noiseSeed = Math.max(1, Number(seed) || Number(resolved.erosionSeed) || 1001);
  const seedRng = createRng(noiseSeed);
  const seedOffset = new THREE.Vector3(
    seedRng() * 23,
    seedRng() * 31,
    seedRng() * 41
  );

  return Object.freeze({
    uniforms: {
      uDamageProgress: { value: hitRatio },
      uErosionOpacity: { value: resolved.crackAlpha },
      uNoiseSeedOffset: { value: seedOffset },
      uNoiseScale: { value: resolved.noiseScale },
      uNoiseContrast: { value: resolved.noiseContrast },
      uNoiseOctaves: { value: resolved.noiseOctaves },
      uNoiseLacunarity: { value: resolved.noiseLacunarity },
      uNoiseGain: { value: resolved.noiseGain },
      uDetailScale: { value: resolved.detailScale },
      uDetailAmount: { value: resolved.detailAmount },
      uCoverageStart: { value: resolved.coverageStart },
      uCoverageEnd: { value: resolved.coverageEnd },
      uGrowthCurve: { value: resolved.growthCurve },
      uEdgeLightBrightness: { value: resolved.edgeLightBrightness },
      uEdgeLightRange: { value: resolved.edgeLightRange },
      uHoleEdgeSoftness: { value: resolved.holeEdgeSoftness },
    },
    uniformsSource: `
      uniform float uDamageProgress;
      uniform float uErosionOpacity;
      uniform vec3 uNoiseSeedOffset;
      uniform float uNoiseScale;
      uniform float uNoiseContrast;
      uniform float uNoiseOctaves;
      uniform float uNoiseLacunarity;
      uniform float uNoiseGain;
      uniform float uDetailScale;
      uniform float uDetailAmount;
      uniform float uCoverageStart;
      uniform float uCoverageEnd;
      uniform float uGrowthCurve;
      uniform float uEdgeLightBrightness;
      uniform float uEdgeLightRange;
      uniform float uHoleEdgeSoftness;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(
            mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
            f.y
          ),
          mix(
            mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
            mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
            f.y
          ),
          f.z
        );
      }

      float fbm(vec3 p, float octaves, float lacunarity, float gain) {
        float value = 0.0;
        float amp = 0.56;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= octaves) break;
          value += noise(p * freq) * amp;
          freq *= lacunarity;
          amp *= gain;
          p += vec3(17.7, -11.3, 8.9);
        }
        return clamp(value, 0.0, 1.0);
      }

      float ridgedFbm(vec3 p) {
        float value = 0.0;
        float amp = 0.58;
        float freq = 1.0;
        for (int i = 0; i < 8; i += 1) {
          if (float(i) >= uNoiseOctaves) break;
          float ridge = 1.0 - abs(noise(p * freq) * 2.0 - 1.0);
          ridge *= ridge;
          value += ridge * amp;
          freq *= uNoiseLacunarity * 1.04;
          amp *= uNoiseGain * 0.92;
          p += vec3(-6.4, 19.1, 12.8);
        }
        return clamp(value, 0.0, 1.0);
      }

      float perlinErosionField(vec3 p) {
        float base = fbm(p, uNoiseOctaves, uNoiseLacunarity, uNoiseGain);
        float ridge = ridgedFbm(p * 0.82 + vec3(3.4, -7.8, 2.1));
        float broad = fbm(p * 0.46 + vec3(-11.2, 4.6, 9.3), uNoiseOctaves, uNoiseLacunarity, uNoiseGain);
        return clamp(base * 0.46 + ridge * 0.34 + broad * 0.32, 0.0, 1.0);
      }
    `,
    fragmentSource: `
        vec3 n = normalize(vLifecycleLocalNormal);
        vec3 noisePoint = n * uNoiseScale + uNoiseSeedOffset;
        float field = perlinErosionField(noisePoint);
        float detail = fbm(n * uDetailScale + uNoiseSeedOffset.yzx + vec3(9.7, -4.1, 6.3), uNoiseOctaves, uNoiseLacunarity, uNoiseGain);
        field = clamp(field + ((detail - 0.5) * uDetailAmount), 0.0, 1.0);
        field = clamp((field - 0.5) * uNoiseContrast + 0.5, 0.0, 1.0);
        float progress = pow(clamp(uDamageProgress, 0.0, 1.0), uGrowthCurve);
        float threshold = mix(uCoverageStart, uCoverageEnd, progress);
        float softness = max(0.001, uHoleEdgeSoftness * 0.035);
        float holeCut = 1.0 - smoothstep(threshold - softness, threshold + softness, field);
        float edgeWidth = max(0.002, uEdgeLightRange * 0.006);
        float edgeStress = 1.0 - smoothstep(0.0, edgeWidth, abs(field - threshold));
        edgeStress *= 1.0 - holeCut * 0.6;
        float edgeLight = smoothstep(0.0, 0.7, uErosionOpacity) * edgeStress * uEdgeLightBrightness;
        pearl = mix(pearl, vec3(1.0), clamp(edgeLight, 0.0, 1.0));
        alpha *= 1.0 - clamp(holeCut * uErosionOpacity, 0.0, 1.0);
        if (alpha * uOpacity < 0.01) discard;
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
