import * as THREE from "three";
import { createRng } from "./orb-lifecycle-vfx-runtime.js";
import { ORB_LIFECYCLE_3D_DEFAULTS } from "./orb-lifecycle-3d-default.js";

const MAX_VORONOI_CELLS = 16;

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
    maxCracks: clampInt(source.maxCracks, 2, MAX_VORONOI_CELLS, ORB_LIFECYCLE_3D_DEFAULTS.maxCracks),
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

function colorToVector(color) {
  const c = new THREE.Color(Number(color) >>> 0);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function createUnequalVoronoiSites(seed = 1, count = 3) {
  const rng = createRng((Number(seed) || 1) ^ 0x7a11c3);
  const cells = Math.max(2, Math.min(MAX_VORONOI_CELLS, Math.round(Number(count) || 3)));
  return Array.from({ length: MAX_VORONOI_CELLS }, (_, index) => {
    const site = randomUnitVector(rng);
    if (site.z < -0.45) site.z = Math.abs(site.z) * 0.7;
    site.normalize();
    const weight = ((rng() - 0.5) * 0.18) + (Math.sin((index + 1) * 2.37) * 0.045);
    return new THREE.Vector4(site.x, site.y, site.z, index < cells ? weight : 999);
  });
}

function createLowCellVoronoiMaterial({
  hitRatio = 0,
  activeCells = 3,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const cellCount = Math.max(2, Math.min(MAX_VORONOI_CELLS, Math.round(Number(activeCells) || 3)));
  const sites = createUnequalVoronoiSites(seed, cellCount);
  return new THREE.ShaderMaterial({
    name: "orb_lifecycle3d:low_cell_voronoi_material",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    extensions: {
      derivatives: true,
    },
    uniforms: {
      uHitRatio: { value: Math.max(0, Math.min(1, hitRatio)) },
      uLineWidth: { value: Math.max(0.0025, Math.min(0.06, resolved.crackWidthPx * 0.006)) },
      uAlpha: { value: resolved.crackAlpha },
      uCellCount: { value: cellCount },
      uCrackColor: { value: colorToVector(resolved.crackColor) },
      uSites: { value: sites },
    },
    vertexShader: `
      varying vec3 vSphereNormal;

      void main() {
        vSphereNormal = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uHitRatio;
      uniform float uLineWidth;
      uniform float uAlpha;
      uniform float uCellCount;
      uniform vec3 uCrackColor;
      uniform vec4 uSites[${MAX_VORONOI_CELLS}];

      varying vec3 vSphereNormal;

      float siteDistance(vec3 n, vec4 site) {
        return (1.0 - dot(n, normalize(site.xyz))) + site.w;
      }

      void main() {
        vec3 n = normalize(vSphereNormal);
        float nearest = 999.0;
        float second = 999.0;
        for (int i = 0; i < ${MAX_VORONOI_CELLS}; i += 1) {
          float active = step(float(i) + 0.5, uCellCount);
          float d = mix(999.0, siteDistance(n, uSites[i]), active);
          if (d < nearest) {
            second = nearest;
            nearest = d;
          } else if (d < second) {
            second = d;
          }
        }

        float seamGap = max(0.0, second - nearest);
        float aa = max(0.0006, fwidth(seamGap));
        float seam = 1.0 - smoothstep(uLineWidth, uLineWidth + aa, seamGap);
        float alpha = seam * uAlpha * smoothstep(0.0, 0.18, uHitRatio);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uCrackColor, alpha);
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
  const ratio = Math.max(0, Math.min(1, hits / total));
  const activeCells = Math.max(2, Math.min(MAX_VORONOI_CELLS, resolved.maxCracks + hits - 1));
  const group = new THREE.Group();
  group.name = "orb_lifecycle3d:cracks";
  if (hits <= 0) return group;

  const radius = Math.max(1, Number(bo) || 72) * 0.5;
  const lift = Math.max(0.002, Number(resolved.crackLiftBO) || 0.006) * Math.max(1, Number(bo) || 72);
  const material = createLowCellVoronoiMaterial({
    hitRatio: ratio,
    activeCells,
    seed,
    config: resolved,
  });
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius + lift, 96, 48),
    material
  );
  shell.name = "orb_lifecycle3d:low_cell_voronoi_shell";
  shell.renderOrder = 12;
  group.add(shell);

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
