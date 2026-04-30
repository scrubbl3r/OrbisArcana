import * as THREE from "three";
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

function colorToVector(color) {
  const c = new THREE.Color(Number(color) >>> 0);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function createVoronoiShellMaterial({
  hitRatio = 0,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  return new THREE.ShaderMaterial({
    name: "orb_lifecycle3d:voronoi_shell_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uHitRatio: { value: Math.max(0, Math.min(1, hitRatio)) },
      uSeed: { value: (Number(seed) || 1) * 0.0000137 },
      uScale: { value: Math.max(2.2, Math.min(9.0, 2.6 + (resolved.maxCracks * 0.075))) },
      uLineWidth: { value: Math.max(0.018, Math.min(0.18, resolved.crackWidthPx * 0.026)) },
      uAlpha: { value: resolved.crackAlpha },
      uCriticalGlow: { value: resolved.criticalGlow },
      uCrackColor: { value: colorToVector(resolved.crackColor) },
      uTroughColor: { value: new THREE.Vector3(0.005, 0.012, 0.018) },
      uEnergyColor: { value: new THREE.Vector3(0.11, 0.82, 0.9) },
    },
    vertexShader: `
      varying vec3 vPos;
      varying vec3 vNormal;

      void main() {
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uTime;
      uniform float uHitRatio;
      uniform float uSeed;
      uniform float uScale;
      uniform float uLineWidth;
      uniform float uAlpha;
      uniform float uCriticalGlow;
      uniform vec3 uCrackColor;
      uniform vec3 uTroughColor;
      uniform vec3 uEnergyColor;

      varying vec3 vPos;
      varying vec3 vNormal;

      vec3 hash3(vec3 p) {
        p = vec3(
          dot(p, vec3(127.1, 311.7, 74.7)),
          dot(p, vec3(269.5, 183.3, 246.1)),
          dot(p, vec3(113.5, 271.9, 124.6))
        );
        return fract(sin(p + uSeed) * 43758.5453123);
      }

      vec2 voronoiBorder(vec3 x) {
        vec3 n = floor(x);
        vec3 f = fract(x);
        float nearest = 8.0;
        float secondNearest = 8.0;

        for (int k = -1; k <= 1; k += 1) {
          for (int j = -1; j <= 1; j += 1) {
            for (int i = -1; i <= 1; i += 1) {
              vec3 g = vec3(float(i), float(j), float(k));
              vec3 o = hash3(n + g);
              vec3 drift = 0.5 + 0.34 * sin((uTime * 0.32) + 6.2831853 * o);
              vec3 r = g + mix(o, drift, 0.42) - f;
              float d = dot(r, r);
              if (d < nearest) {
                secondNearest = nearest;
                nearest = d;
              } else if (d < secondNearest) {
                secondNearest = d;
              }
            }
          }
        }

        return vec2(nearest, secondNearest - nearest);
      }

      void main() {
        vec3 normal = normalize(vPos);
        vec2 cell = voronoiBorder(normal * uScale);
        float borderDistance = cell.y;
        float damage = smoothstep(0.02, 1.0, uHitRatio);
        float critical = pow(damage, 2.0) * max(0.0, uCriticalGlow - 1.0);
        float pulse = 0.78 + 0.22 * sin(uTime * (2.2 + damage * 2.0) + cell.x * 18.0);

        float groove = 1.0 - smoothstep(uLineWidth * 0.38, uLineWidth * 1.15, borderDistance);
        float rim = smoothstep(uLineWidth * 0.48, uLineWidth * 1.35, borderDistance)
          * (1.0 - smoothstep(uLineWidth * 1.35, uLineWidth * 3.8, borderDistance));
        float haze = 1.0 - smoothstep(uLineWidth * 2.2, uLineWidth * 8.2, borderDistance);
        float facing = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.5);

        vec3 energy = mix(uEnergyColor, uCrackColor, 0.62);
        vec3 color = mix(uTroughColor, energy, rim * (0.8 + critical));
        color += uCrackColor * haze * damage * 0.18 * pulse;
        color += uEnergyColor * facing * damage * 0.16;

        float alpha = damage * uAlpha * (
          groove * 0.48 +
          rim * (0.42 + critical * 0.22) +
          haze * 0.10
        );

        if (alpha < 0.006) discard;
        gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.9));
      }
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
  const ratio = Math.max(0, Math.min(1, hits / total));
  const material = createVoronoiShellMaterial({ hitRatio: ratio, seed, config: resolved });
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius + lift + 0.06, 72, 36),
    material
  );
  shell.name = "orb_lifecycle3d:voronoi_energy_shell";
  group.add(shell);
  return group;
}

export function updateOrbLifecycle3dCracks(cracks, nowMs = performance.now()) {
  if (!cracks || !cracks.traverse) return;
  const t = Math.max(0, Number(nowMs) || performance.now()) / 1000;
  cracks.traverse((child) => {
    const uniforms = child && child.material && child.material.uniforms;
    if (uniforms && uniforms.uTime) uniforms.uTime.value = t;
  });
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
