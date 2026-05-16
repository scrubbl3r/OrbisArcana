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

function progressiveCellCount(startCells, hits) {
  const start = Math.max(2, Math.round(Number(startCells) || 2));
  const hitCount = Math.max(0, Math.round(Number(hits) || 0));
  if (hitCount <= 1) return start;
  const addedCells = ((hitCount * (hitCount + 1)) / 2) - 1;
  return start + addedCells;
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

function colorToVector(color) {
  const c = new THREE.Color(Number(color) >>> 0);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function tangentForNormal(normal, rng) {
  const reference = Math.abs(normal.y) < 0.86 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const angle = rng() * Math.PI * 2;
  return tangent.multiplyScalar(Math.cos(angle)).add(bitangent.multiplyScalar(Math.sin(angle))).normalize();
}

function createSplitUniforms(splits) {
  return splits.reduce((uniforms, split, index) => {
    uniforms[`uSplitPlane${index}`] = { value: split.plane };
    return uniforms;
  }, {});
}

function buildSplitLines(splits) {
  const lines = [];
  splits.forEach((split, index) => {
    lines.push(
      `        if (abs(cellId - ${split.parentId.toFixed(1)}) < 0.5) {`,
      `          float splitSide${index} = dot(n, normalize(uSplitPlane${index}));`,
      `          float splitAa${index} = max(0.0006, fwidth(splitSide${index}));`,
      `          seam = max(seam, 1.0 - smoothstep(uLineWidth, uLineWidth + splitAa${index}, abs(splitSide${index})));`,
      `          cellId = splitSide${index} >= 0.0 ? ${split.positiveId.toFixed(1)} : ${split.negativeId.toFixed(1)};`,
      "        }"
    );
  });
  return lines.join("\n");
}

function createHierarchicalSplits(seed = 1, cellCount = 2) {
  const rng = createRng((Number(seed) || 1) ^ 0x5ab1e31);
  const targetCells = Math.max(2, Math.min(MAX_VORONOI_CELLS, Math.round(Number(cellCount) || 2)));
  const leaves = [{
    id: 0,
    center: new THREE.Vector3(0, 0, 1),
    area: 1,
    depth: 0,
  }];
  const splits = [];
  let nextId = 1;

  while (leaves.length < targetCells) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    leaves.forEach((leaf, index) => {
      const front = Math.max(0, leaf.center.z);
      const score = leaf.area * (1 + (front * 1.35)) * (1 - (leaf.depth * 0.035));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const leaf = leaves.splice(bestIndex, 1)[0];
    const baseCenter = leaf.center.clone().normalize();
    const tangent = tangentForNormal(baseCenter, rng);
    const wobble = tangentForNormal(tangent, rng).multiplyScalar((rng() - 0.5) * 0.32);
    const plane = tangent.add(wobble).normalize();
    const positiveId = nextId;
    const negativeId = nextId + 1;
    nextId += 2;
    splits.push({
      parentId: leaf.id,
      positiveId,
      negativeId,
      plane,
    });

    const splitBias = 0.42 + (rng() * 0.16);
    const positiveArea = leaf.area * splitBias;
    const negativeArea = leaf.area - positiveArea;
    leaves.push({
      id: positiveId,
      center: baseCenter.clone().add(plane.clone().multiplyScalar(0.72)).normalize(),
      area: positiveArea,
      depth: leaf.depth + 1,
    });
    leaves.push({
      id: negativeId,
      center: baseCenter.clone().add(plane.clone().multiplyScalar(-0.72)).normalize(),
      area: negativeArea,
      depth: leaf.depth + 1,
    });
  }

  return splits;
}

function createHierarchicalFractureMaterial({
  hitRatio = 0,
  activeCells = 3,
  seed = 1,
  config = ORB_LIFECYCLE_3D_DEFAULTS,
} = {}) {
  const resolved = resolveOrbLifecycle3dConfig(config);
  const cellCount = Math.max(2, Math.min(MAX_VORONOI_CELLS, Math.round(Number(activeCells) || 3)));
  const splits = createHierarchicalSplits(seed, cellCount);
  return new THREE.ShaderMaterial({
    name: "orb_lifecycle3d:hierarchical_fracture_material",
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
      uCrackColor: { value: colorToVector(resolved.crackColor) },
      ...createSplitUniforms(splits),
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
      uniform vec3 uCrackColor;
      ${splits.map((split, index) => `uniform vec3 uSplitPlane${index};`).join("\n      ")}

      varying vec3 vSphereNormal;

      void main() {
        vec3 n = normalize(vSphereNormal);
        float cellId = 0.0;
        float seam = 0.0;
${buildSplitLines(splits)}

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
  const activeCells = Math.max(2, Math.min(MAX_VORONOI_CELLS, progressiveCellCount(resolved.maxCracks, hits)));
  const group = new THREE.Group();
  group.name = "orb_lifecycle3d:cracks";
  if (hits <= 0) return group;

  const radius = Math.max(1, Number(bo) || 72) * 0.5;
  const lift = Math.max(0.002, Number(resolved.crackLiftBO) || 0.006) * Math.max(1, Number(bo) || 72);
  const material = createHierarchicalFractureMaterial({
    hitRatio: ratio,
    activeCells,
    seed,
    config: resolved,
  });
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius + lift, 96, 48),
    material
  );
  shell.name = "orb_lifecycle3d:hierarchical_fracture_shell";
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
