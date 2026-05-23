import * as THREE from "three";
import { createWorldObjectInspector } from "../../world-workshop/inspectors/world-object-inspector.js?v=20260426a";
import { ORB_BLOOM_CONFIG } from "../../world-workshop/effects/bloom/bloom-config.js?v=20260426a";
import { createOrbModel } from "../../../src/game-runtime/orb/orb-3d-model.js?v=20260428a";
import {
  createOpalescentOrbShellMaterial,
  createOrbPointLight,
  updateOrbPointLight,
} from "../../../src/game-runtime/orb/orb-3d-material.js?v=20260428a";
import { ORB_3D_VISUAL_DEFAULTS } from "../../../src/game-runtime/orb/orb-3d-default.js?v=20260517a";

const ORB_RADIUS_BO = 0.5;
const MAX_FIELD_SEGMENTS = 128;

function frameCameraToSsotOrbSize(inspector, root, bo) {
  if (!inspector || !inspector.camera || !root) return;
  const bounds = root.getBoundingClientRect();
  const viewportHeight = Math.max(1, Number(bounds.height) || 1);
  const camera = inspector.camera;
  const fovRadians = (Number(camera.fov) || 45) * Math.PI / 180;
  const distance = viewportHeight / (2 * Math.tan(fovRadians * 0.5));
  camera.position.set(0, 0, distance);
  camera.near = Math.max(0.1, bo * 0.05);
  camera.far = Math.max(2000, distance + bo * 20);
  camera.updateProjectionMatrix();
  if (inspector.controls) {
    inspector.controls.target.set(0, 0, 0);
    inspector.controls.minDistance = Math.max(bo * 0.75, distance * 0.35);
    inspector.controls.maxDistance = Math.max(bo * 12, distance * 3);
    inspector.controls.update();
  }
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  const safe = Number.isFinite(numeric) ? numeric : Number(fallback);
  return Math.max(min, Math.min(max, Number.isFinite(safe) ? safe : min));
}

function readInputNumber(el, fallback, min = -Infinity, max = Infinity) {
  return clampNumber(el && el.value, min, max, fallback);
}

function readInputBoolean(el, fallback = true) {
  if (!el) return !!fallback;
  return !!el.checked;
}

function random01(seed) {
  const x = Math.sin((Number(seed) || 0) * 12.9898) * 43758.5453123;
  return x - Math.floor(x);
}

function rgbColor(r = 255, g = 255, b = 255) {
  return new THREE.Color(
    clampNumber(r, 0, 255, 255) / 255,
    clampNumber(g, 0, 255, 255) / 255,
    clampNumber(b, 0, 255, 255) / 255
  );
}

function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
    if (child.material && typeof child.material.dispose === "function") {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose && material.dispose());
      else child.material.dispose();
    }
  });
}

function midpointTree({ from, to, bo, subdivisions, displacementBo, decay, smoothing, seed, time }) {
  let points = [from.clone(), to.clone()];
  let amplitude = Math.max(0, Number(displacementBo) || 0) * bo;
  const safeDecay = clampNumber(decay, 0, 1, 0.58);
  for (let depth = 0; depth < subdivisions; depth += 1) {
    const next = [points[0]];
    for (let index = 0; index < points.length - 1; index += 1) {
      const a = points[index];
      const b = points[index + 1];
      const mid = a.clone().lerp(b, 0.5);
      const tangent = b.clone().sub(a).normalize();
      let normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
      if (normal.lengthSq() < 0.000001) normal = new THREE.Vector3(1, 0, 0);
      normal.normalize();
      const zAxis = new THREE.Vector3(0, 0, 1).cross(tangent).normalize();
      const roll = random01(seed + depth * 83 + index * 31 + Math.floor(time * 60) * 0.13) * 2 - 1;
      const zRoll = random01(seed + depth * 97 + index * 43 + Math.floor(time * 60) * 0.17) * 2 - 1;
      mid.add(normal.multiplyScalar(roll * amplitude));
      if (zAxis.lengthSq() > 0.000001) mid.add(zAxis.multiplyScalar(zRoll * amplitude * 0.35));
      next.push(mid, b);
    }
    points = next;
    amplitude *= safeDecay;
  }
  const smooth = clampNumber(smoothing, 0, 1, 0.22);
  if (smooth > 0 && points.length > 3) {
    const smoothed = [points[0]];
    for (let index = 1; index < points.length - 1; index += 1) {
      smoothed.push(points[index].clone().lerp(points[index - 1].clone().add(points[index + 1]).multiplyScalar(0.5), smooth * 0.5));
    }
    smoothed.push(points[points.length - 1]);
    points = smoothed;
  }
  return points;
}

function createLightningFieldMaterial({
  segments,
  bo,
  coreColor,
  glowColor,
  coreWidth,
  glowWidth,
  coreIntensity,
  glowIntensity,
  coreSoftness,
  glowSoftness,
  flickerHz,
  flickerDepth,
  tipOpacity,
  centralCoreEnabled,
  centralCoreRadius,
  centralCoreGlowRadius,
  centralCoreIntensity,
  centralCoreSoftness,
  centralCoreNoiseScale,
  centralCoreNoiseSpeed,
  coreAlpha,
  glowAlpha,
  time,
}) {
  const starts = [];
  const ends = [];
  const weights = [];
  const safeSegments = Array.isArray(segments) ? segments.slice(0, MAX_FIELD_SEGMENTS) : [];
  for (let index = 0; index < MAX_FIELD_SEGMENTS; index += 1) {
    const segment = safeSegments[index];
    starts.push(segment ? segment.from : new THREE.Vector3());
    ends.push(segment ? segment.to : new THREE.Vector3());
    weights.push(segment ? new THREE.Vector3(segment.strength, segment.fade, segment.seed) : new THREE.Vector3());
  }
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uSegmentCount: { value: safeSegments.length },
      uSegmentStart: { value: starts },
      uSegmentEnd: { value: ends },
      uSegmentWeight: { value: weights },
      uBo: { value: Math.max(1, bo) },
      uTime: { value: time },
      uCoreColor: { value: coreColor },
      uGlowColor: { value: glowColor },
      uCoreAlpha: { value: clampNumber(coreAlpha, 0, 1, 1) },
      uGlowAlpha: { value: clampNumber(glowAlpha, 0, 1, 1) },
      uCoreWidth: { value: Math.max(0.001, coreWidth) },
      uGlowWidth: { value: Math.max(0.001, glowWidth) },
      uCoreIntensity: { value: clampNumber(coreIntensity, 0, 20, 5.5) },
      uGlowIntensity: { value: clampNumber(glowIntensity, 0, 20, 3.2) },
      uCoreSoftness: { value: clampNumber(coreSoftness, 0, 1, 0.22) },
      uGlowSoftness: { value: clampNumber(glowSoftness, 0, 1, 0.82) },
      uFlickerHz: { value: clampNumber(flickerHz, 0, 60, 4) },
      uFlickerDepth: { value: clampNumber(flickerDepth, 0, 1, 0.5) },
      uTipOpacity: { value: clampNumber(tipOpacity, 0, 1, 0) },
      uCentralCoreEnabled: { value: centralCoreEnabled ? 1 : 0 },
      uCentralCoreRadius: { value: Math.max(0, centralCoreRadius) },
      uCentralCoreGlowRadius: { value: Math.max(0.001, centralCoreGlowRadius) },
      uCentralCoreIntensity: { value: clampNumber(centralCoreIntensity, 0, 20, 3.6) },
      uCentralCoreSoftness: { value: clampNumber(centralCoreSoftness, 0, 1, 0.55) },
      uCentralCoreNoiseScale: { value: clampNumber(centralCoreNoiseScale, 0, 200, 50) },
      uCentralCoreNoiseSpeed: { value: clampNumber(centralCoreNoiseSpeed, 0, 60, 5) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      #define MAX_SEGMENTS ${MAX_FIELD_SEGMENTS}
      uniform int uSegmentCount;
      uniform vec3 uSegmentStart[MAX_SEGMENTS];
      uniform vec3 uSegmentEnd[MAX_SEGMENTS];
      uniform vec3 uSegmentWeight[MAX_SEGMENTS];
      uniform float uBo;
      uniform float uTime;
      uniform vec3 uCoreColor;
      uniform vec3 uGlowColor;
      uniform float uCoreAlpha;
      uniform float uGlowAlpha;
      uniform float uCoreWidth;
      uniform float uGlowWidth;
      uniform float uCoreIntensity;
      uniform float uGlowIntensity;
      uniform float uCoreSoftness;
      uniform float uGlowSoftness;
      uniform float uFlickerHz;
      uniform float uFlickerDepth;
      uniform float uTipOpacity;
      uniform int uCentralCoreEnabled;
      uniform float uCentralCoreRadius;
      uniform float uCentralCoreGlowRadius;
      uniform float uCentralCoreIntensity;
      uniform float uCentralCoreSoftness;
      uniform float uCentralCoreNoiseScale;
      uniform float uCentralCoreNoiseSpeed;
      varying vec3 vWorldPosition;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = smoothstep(vec3(0.0), vec3(1.0), fract(p));
        float n000 = hash(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
      }

      float fbm(vec3 p) {
        float sum = 0.0;
        float amp = 0.55;
        float norm = 0.0;
        for (int i = 0; i < 4; i += 1) {
          sum += noise(p) * amp;
          norm += amp;
          p *= 2.2;
          amp *= 0.5;
        }
        return sum / max(0.0001, norm);
      }

      float segmentDistance(vec2 p, vec2 a, vec2 b, out float h) {
        vec2 ba = b - a;
        h = clamp(dot(p - a, ba) / max(0.00001, dot(ba, ba)), 0.0, 1.0);
        return length(p - (a + ba * h));
      }

      void main() {
        vec2 p = vWorldPosition.xy;
        float coreEnergy = 0.0;
        float glowEnergy = 0.0;
        for (int i = 0; i < MAX_SEGMENTS; i += 1) {
          if (i >= uSegmentCount) break;
          vec3 a = uSegmentStart[i];
          vec3 b = uSegmentEnd[i];
          float h = 0.0;
          float d = segmentDistance(p, a.xy, b.xy, h);
          float zDelta = abs(mix(a.z, b.z, h) - vWorldPosition.z);
          float zFade = exp(-zDelta / max(uGlowWidth * 3.0, uBo * 0.04));
          float lifeFade = max(0.0, uSegmentWeight[i].y);
          float seed = uSegmentWeight[i].z;
          float tipFade = mix(1.0, uTipOpacity, 1.0 - lifeFade);
          float flicker = 1.0 - uFlickerDepth * (0.5 + 0.5 * sin(uTime * uFlickerHz * 6.2831853 + seed * 2.31));
          float edgeNoise = fbm(vec3(p / max(1.0, uBo) * 7.5 + seed, uTime * 1.8 + seed));
          float coreD = max(0.0005 * uBo, d + (edgeNoise - 0.5) * uCoreWidth * 0.22);
          float glowD = max(0.0, d + (edgeNoise - 0.5) * uGlowWidth * 0.08);
          float coreFalloff = 1.0 - exp(-(uCoreWidth / coreD) * mix(0.55, 1.65, 1.0 - uCoreSoftness));
          float glowFalloff = exp(-pow(glowD / max(0.0001, uGlowWidth), mix(1.35, 3.6, uGlowSoftness)));
          float weight = uSegmentWeight[i].x * lifeFade * tipFade * flicker * zFade;
          coreEnergy += coreFalloff * weight;
          glowEnergy += glowFalloff * weight * 0.62;
        }

        float coreField = 0.0;
        float coreGlow = 0.0;
        if (uCentralCoreEnabled == 1) {
          float cd = length(p);
          float n = fbm(vec3(p / max(1.0, uBo) * uCentralCoreNoiseScale, uTime * uCentralCoreNoiseSpeed));
          float radius = uCentralCoreRadius * (0.88 + n * 0.24);
          float glowRadius = max(radius + 0.001, uCentralCoreGlowRadius);
          float coreFalloff = exp(-pow(cd / max(0.001, radius), mix(1.05, 3.5, uCentralCoreSoftness)));
          float glowFalloff = exp(-pow(cd / glowRadius, mix(0.85, 2.6, uCentralCoreSoftness)));
          coreField = coreFalloff * uCentralCoreIntensity * (0.65 + n * 0.5);
          coreGlow = glowFalloff * uCentralCoreIntensity * 0.42;
        }

        vec3 color = vec3(0.0);
        color += uGlowColor * uGlowAlpha * (glowEnergy * uGlowIntensity * 0.42 + coreGlow);
        color += uCoreColor * uCoreAlpha * (coreEnergy * uCoreIntensity * 0.54 + coreField);
        float alpha = clamp(1.0 - exp(-length(color) * 0.38), 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function appendFieldPolyline(segments, points, strength = 1, fade = 1, seed = 1, maxSegments = 12) {
  if (!Array.isArray(segments) || !Array.isArray(points) || points.length < 2) return;
  const totalPieces = points.length - 1;
  const pieceCount = Math.max(1, Math.min(totalPieces, Math.round(maxSegments)));
  for (let index = 0; index < pieceCount && segments.length < MAX_FIELD_SEGMENTS; index += 1) {
    const startIndex = Math.min(totalPieces - 1, Math.floor(index * totalPieces / pieceCount));
    const endIndex = Math.min(totalPieces, Math.max(startIndex + 1, Math.floor((index + 1) * totalPieces / pieceCount)));
    const from = points[startIndex];
    const to = points[endIndex];
    if (!from || !to || from.distanceToSquared(to) <= 0.0001) continue;
    const h = index / Math.max(1, pieceCount - 1);
    segments.push({
      from: from.clone(),
      to: to.clone(),
      strength,
      fade: fade * (1 - h * 0.28),
      seed: seed + index * 0.071,
    });
  }
}

export function createTesla1Preview({
  els = {},
  getOrbBaseVisualState = null,
} = {}) {
  let inspector = null;
  let shellMaterial = null;
  let orbLight = null;
  let model = null;
  let masterLayer = null;
  let haloLayer = null;
  let treeLayer = null;
  let createdAt = 0;

  function readBo() {
    const visualState = typeof getOrbBaseVisualState === "function" ? getOrbBaseVisualState() : null;
    return Math.max(16, Number(visualState && visualState.diameterPx) || 72);
  }

  function clearLayer(layer) {
    if (!layer) return;
    while (layer.children.length) {
      const child = layer.children[0];
      layer.remove(child);
      disposeObject(child);
    }
  }

  function destroyInspector() {
    if (inspector && typeof inspector.cleanup === "function") inspector.cleanup();
    inspector = null;
    shellMaterial = null;
    orbLight = null;
    model = null;
    masterLayer = null;
    haloLayer = null;
    treeLayer = null;
  }

  function masterRoute(bo, time) {
    const minRange = readInputNumber(els.tesla1MasterBoltMinRangeBo, 4, 0, 64);
    const maxRange = readInputNumber(els.tesla1MasterBoltMaxRangeBo, 7, minRange + 0.25, 64);
    const angle = time * 0.28 + 0.75;
    const radius = bo * (minRange + (maxRange - minRange) * (0.5 + 0.5 * Math.sin(time * 0.41)));
    const start = new THREE.Vector3(Math.cos(angle) * bo * ORB_RADIUS_BO, Math.sin(angle) * bo * ORB_RADIUS_BO, 0);
    const end = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    const bend = readInputNumber(els.tesla1MasterBoltPathBendAllowance, 1.4, 1, 8);
    if (bend <= 1.05) return [start, end];
    const normal = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const steer = start.clone().lerp(end, 0.55).add(normal.multiplyScalar(bo * Math.min(1.25, (bend - 1) * 0.4)));
    return [start, steer, end];
  }

  function readTreeConfig() {
    const boltMin = Math.round(readInputNumber(els.tesla1LightningTreeBoltCountMin, 4, 0, 256));
    const boltMax = Math.round(readInputNumber(els.tesla1LightningTreeBoltCountMax, 12, boltMin, 256));
    return Object.freeze({
      boltCount: Math.round((boltMin + boltMax) * 0.5),
      subdivisions: Math.round(readInputNumber(els.tesla1LightningTreeSubdivisions, 5, 0, 10)),
      displacementBo: readInputNumber(els.tesla1LightningTreeDisplacementBo, 0.22, 0, 8),
      displacementDecay: readInputNumber(els.tesla1LightningTreeDisplacementDecay, 0.58, 0, 1),
      smoothing: readInputNumber(els.tesla1LightningTreeSmoothing, 0.22, 0, 1),
      noiseSpeedHz: readInputNumber(els.tesla1LightningTreeNoiseSpeedHz, 18, 0, 120),
      forkChance: readInputNumber(els.tesla1LightningTreeForkChance, 0.15, 0, 1),
      forkDepth: Math.round(readInputNumber(els.tesla1LightningTreeForkDepth, 1, 0, 4)),
      branchChance: readInputNumber(els.tesla1LightningTreeBranchChance, 0.18, 0, 1),
      branchLengthMinBo: readInputNumber(els.tesla1LightningTreeBranchLengthMinBo, 0.08, 0, 8),
      branchLengthMaxBo: readInputNumber(els.tesla1LightningTreeBranchLengthMaxBo, 0.32, 0, 8),
    });
  }

  function syncMasterLayer(bo, time) {
    if (!masterLayer) return;
    clearLayer(masterLayer);
    masterLayer.visible = !els.tesla1MasterBoltVisibleBtn || els.tesla1MasterBoltVisibleBtn.getAttribute("aria-pressed") !== "false";
    const route = masterRoute(bo, time);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route),
      new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false, toneMapped: false })
    );
    line.name = "tesla1:master_bolt_route";
    line.renderOrder = 218;
    masterLayer.add(line);
    const pointGeometry = new THREE.SphereGeometry(bo * 0.025, 12, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false, depthWrite: false, toneMapped: false });
    route.forEach((point, index) => {
      const marker = new THREE.Mesh(pointGeometry, pointMaterial);
      marker.name = `tesla1:master_control_point_${index}`;
      marker.position.copy(point);
      marker.renderOrder = 219;
      masterLayer.add(marker);
    });
  }

  function syncHaloLayer(bo) {
    if (!haloLayer) return;
    clearLayer(haloLayer);
    haloLayer.visible = !els.tesla1HaloVisibleBtn || els.tesla1HaloVisibleBtn.getAttribute("aria-pressed") !== "false";
    if (!readInputBoolean(els.tesla1HaloFieldEnabled, true)) return;
    const radius = readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32) * bo;
    const zMin = readInputNumber(els.tesla1HaloFieldZMinBo, -0.3, -32, 32);
    const zMax = readInputNumber(els.tesla1HaloFieldZMaxBo, 0.3, zMin, 32);
    const zScale = Math.max(0.02, Math.max(Math.abs(zMin), Math.abs(zMax)) / Math.max(0.001, readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32)));
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 16),
      new THREE.MeshBasicMaterial({
        color: 0x376fff,
        transparent: true,
        opacity: 0.12,
        wireframe: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      })
    );
    shell.name = "tesla1:halo_envelope";
    shell.scale.z = zScale;
    shell.renderOrder = 210;
    haloLayer.add(shell);
  }

  function syncTreeLayer(bo, time) {
    if (!treeLayer) return;
    clearLayer(treeLayer);
    treeLayer.visible = !els.tesla1LightningTreeVisibleBtn || els.tesla1LightningTreeVisibleBtn.getAttribute("aria-pressed") !== "false";
    const tree = readTreeConfig();
    const fieldSegments = [];
    const startMin = readInputNumber(els.tesla1HaloFieldBoltStartMinBo, 0.5, 0, 32);
    const startMax = readInputNumber(els.tesla1HaloFieldBoltStartMaxBo, 0.65, startMin, 32);
    const endMin = readInputNumber(els.tesla1HaloFieldBoltEndMinBo, 1.1, 0.05, 32);
    const endMax = readInputNumber(els.tesla1HaloFieldBoltEndMaxBo, 1.6, endMin, 32);
    const zMin = readInputNumber(els.tesla1HaloFieldZMinBo, -0.3, -32, 32);
    const zMax = readInputNumber(els.tesla1HaloFieldZMaxBo, 0.3, zMin, 32);
    const animatedSeed = Math.floor(time * Math.max(1, tree.noiseSpeedHz));
    const count = Math.max(0, tree.boltCount);
    const haloSegmentBudget = Math.max(4, Math.floor((MAX_FIELD_SEGMENTS - 28) / Math.max(1, count)));
    for (let index = 0; index < count; index += 1) {
      const baseSeed = index * 101 + animatedSeed * 17;
      const theta = Math.PI * 2 * ((index + 0.5) / Math.max(1, count) + (random01(baseSeed) - 0.5) * 0.055 + time * 0.018);
      const startRadius = bo * (startMin + (startMax - startMin) * random01(baseSeed + 7));
      const endRadius = bo * (endMin + (endMax - endMin) * random01(baseSeed + 11));
      const zStart = bo * (zMin + (zMax - zMin) * random01(baseSeed + 5));
      const zEnd = bo * (zMin + (zMax - zMin) * random01(baseSeed + 19));
      const endTheta = theta + (random01(baseSeed + 13) - 0.5) * 0.36;
      const start = new THREE.Vector3(Math.cos(theta) * startRadius, Math.sin(theta) * startRadius, zStart);
      const end = new THREE.Vector3(Math.cos(endTheta) * endRadius, Math.sin(endTheta) * endRadius, zEnd);
      const trunk = midpointTree({
        from: start,
        to: end,
        bo,
        subdivisions: tree.subdivisions,
        displacementBo: tree.displacementBo,
        decay: tree.displacementDecay,
        smoothing: tree.smoothing,
        seed: baseSeed,
        time,
      });
      appendFieldPolyline(fieldSegments, trunk, 0.82, 0.96, baseSeed, haloSegmentBudget);
      if (random01(baseSeed + 23) < tree.branchChance && trunk.length > 4) {
        const branchAt = 1 + Math.floor(random01(baseSeed + 29) * (trunk.length - 3));
        const a = trunk[branchAt - 1];
        const b = trunk[branchAt + 1];
        const dir = b.clone().sub(a).normalize();
        const normal = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
        const branchLength = bo * (tree.branchLengthMinBo + (tree.branchLengthMaxBo - tree.branchLengthMinBo) * random01(baseSeed + 31));
        const branchEnd = trunk[branchAt].clone().add(normal.multiplyScalar(branchLength * (random01(baseSeed + 37) < 0.5 ? -1 : 1)));
        const branch = midpointTree({
          from: trunk[branchAt],
          to: branchEnd,
          bo,
          subdivisions: Math.max(1, Math.min(tree.subdivisions, 3)),
          displacementBo: tree.displacementBo * 0.6,
          decay: tree.displacementDecay,
          smoothing: tree.smoothing,
          seed: baseSeed + 41,
          time,
        });
        appendFieldPolyline(fieldSegments, branch, 0.46, 0.72, baseSeed + 41, 4);
      }
    }
    const master = masterRoute(bo, time);
    const masterTree = midpointTree({
      from: master[0],
      to: master[master.length - 1],
      bo,
      subdivisions: Math.max(2, tree.subdivisions),
      displacementBo: tree.displacementBo,
      decay: tree.displacementDecay,
      smoothing: tree.smoothing,
      seed: 999 + animatedSeed,
      time,
    });
    appendFieldPolyline(fieldSegments, masterTree, 1.18, 1, 999 + animatedSeed, 20);
    if (!readInputBoolean(els.tesla1BoltShaderEnabled, true)) {
      fieldSegments.forEach((segment, index) => {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([segment.from, segment.to]),
          new THREE.LineBasicMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.38, depthTest: false, depthWrite: false, toneMapped: false })
        );
        line.name = `tesla1:field_fallback_${index}`;
        line.renderOrder = 214;
        treeLayer.add(line);
      });
      return;
    }
    const coreColor = rgbColor(els.tesla1BoltShaderCoreR && els.tesla1BoltShaderCoreR.value, els.tesla1BoltShaderCoreG && els.tesla1BoltShaderCoreG.value, els.tesla1BoltShaderCoreB && els.tesla1BoltShaderCoreB.value);
    const glowColor = rgbColor(els.tesla1BoltShaderGlowR && els.tesla1BoltShaderGlowR.value, els.tesla1BoltShaderGlowG && els.tesla1BoltShaderGlowG.value, els.tesla1BoltShaderGlowB && els.tesla1BoltShaderGlowB.value);
    const coreMin = readInputNumber(els.tesla1BoltShaderCoreWidthMinBo, 0.006, 0, 1);
    const coreMax = readInputNumber(els.tesla1BoltShaderCoreWidthMaxBo, 0.016, coreMin, 1);
    const glowMin = readInputNumber(els.tesla1BoltShaderGlowWidthMinBo, 0.055, 0, 4);
    const glowMax = readInputNumber(els.tesla1BoltShaderGlowWidthMaxBo, 0.16, glowMin, 4);
    const maxRangeBo = Math.max(endMax, readInputNumber(els.tesla1MasterBoltMaxRangeBo, 7, 0.25, 64), readInputNumber(els.tesla1BoltShaderCentralCoreGlowRadiusBo, 0.82, 0, 8));
    const planeSize = bo * Math.max(2.5, maxRangeBo * 2.45);
    const material = createLightningFieldMaterial({
      segments: fieldSegments,
      bo,
      coreColor,
      glowColor,
      coreWidth: bo * (coreMin + coreMax) * 0.5,
      glowWidth: bo * (glowMin + glowMax) * 0.5,
      coreIntensity: readInputNumber(els.tesla1BoltShaderCoreIntensity, 5.5, 0, 20),
      glowIntensity: readInputNumber(els.tesla1BoltShaderGlowIntensity, 3.2, 0, 20),
      coreSoftness: readInputNumber(els.tesla1BoltShaderCoreSoftness, 0.22, 0, 1),
      glowSoftness: readInputNumber(els.tesla1BoltShaderGlowSoftness, 0.82, 0, 1),
      flickerHz: readInputNumber(els.tesla1BoltShaderFlickerSpeedHz, 4, 0, 60),
      flickerDepth: readInputNumber(els.tesla1BoltShaderFlickerDepth, 0.5, 0, 1),
      tipOpacity: readInputNumber(els.tesla1BoltShaderTipOpacity, 0, 0, 1),
      centralCoreEnabled: readInputBoolean(els.tesla1BoltShaderCentralCoreEnabled, true),
      centralCoreRadius: bo * readInputNumber(els.tesla1BoltShaderCentralCoreRadiusBo, 0.42, 0, 8),
      centralCoreGlowRadius: bo * readInputNumber(els.tesla1BoltShaderCentralCoreGlowRadiusBo, 0.82, 0, 8),
      centralCoreIntensity: readInputNumber(els.tesla1BoltShaderCentralCoreIntensity, 3.6, 0, 20),
      centralCoreSoftness: readInputNumber(els.tesla1BoltShaderCentralCoreSoftness, 0.55, 0, 1),
      centralCoreNoiseScale: readInputNumber(els.tesla1BoltShaderCentralCoreNoiseScale, 50, 0, 200),
      centralCoreNoiseSpeed: readInputNumber(els.tesla1BoltShaderCentralCoreNoiseSpeed, 5, 0, 60),
      coreAlpha: readInputNumber(els.tesla1BoltShaderCoreA, 1, 0, 1),
      glowAlpha: readInputNumber(els.tesla1BoltShaderGlowA, 1, 0, 1),
      time,
    });
    const field = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize, 1, 1), material);
    field.name = "tesla1:sdf_lightning_field";
    field.renderOrder = 214;
    treeLayer.add(field);
  }

  function apply() {
    if (!els.previewRoot) return null;
    destroyInspector();
    const bo = readBo();
    const activeConfig = ORB_3D_VISUAL_DEFAULTS;
    createdAt = performance.now();
    inspector = createWorldObjectInspector({
      root: els.previewRoot,
      bo,
      canvasClassName: "tesla1Canvas",
      cameraPositionBo: Object.freeze({ x: 0.92, y: 0.16, z: 3.25 }),
      minDistanceBo: 0.85,
      maxDistanceBo: 28,
      enableShadows: true,
      bloom: ORB_BLOOM_CONFIG.enabled ? ORB_BLOOM_CONFIG : null,
      onFrame: () => {
        const time = (performance.now() - createdAt) / 1000;
        if (shellMaterial && shellMaterial.uniforms && shellMaterial.uniforms.uTime) shellMaterial.uniforms.uTime.value = time;
        if (orbLight) updateOrbPointLight(orbLight, time, activeConfig);
        syncMasterLayer(bo, time);
        syncHaloLayer(bo);
        syncTreeLayer(bo, time);
      },
    });
    if (!inspector) return activeConfig;
    frameCameraToSsotOrbSize(inspector, els.previewRoot, bo);
    shellMaterial = createOpalescentOrbShellMaterial(activeConfig);
    const created = createOrbModel({
      bo,
      shellMaterial,
      edgeMaterials: inspector.edgeMaterials,
      includeCore: false,
      includeRibs: true,
      edgeColor: 0xffffff,
      edgeWidth: 2,
      shellSegments: 96,
      ringSegments: 192,
    });
    model = created.model;
    if (els.tesla1OrbVisibleBtn) model.visible = els.tesla1OrbVisibleBtn.getAttribute("aria-pressed") !== "false";
    orbLight = createOrbPointLight({ bo, config: activeConfig });
    updateOrbPointLight(orbLight, 0, activeConfig);
    model.add(orbLight);
    masterLayer = new THREE.Group();
    masterLayer.name = "tesla1:master_bolt_control_layer";
    haloLayer = new THREE.Group();
    haloLayer.name = "tesla1:halo_envelope_layer";
    treeLayer = new THREE.Group();
    treeLayer.name = "tesla1:lightning_tree_layer";
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.scene.add(haloLayer);
    inspector.scene.add(treeLayer);
    inspector.scene.add(masterLayer);
    syncMasterLayer(bo, 0);
    syncHaloLayer(bo);
    syncTreeLayer(bo, 0);
    inspector.render();
    return activeConfig;
  }

  function clear() {
    destroyInspector();
  }

  function toggleLayer(button, layer) {
    if (!button) return;
    const visible = button.getAttribute("aria-pressed") !== "false";
    button.setAttribute("aria-pressed", visible ? "false" : "true");
    if (layer) layer.visible = !visible;
    if (inspector && typeof inspector.render === "function") inspector.render();
  }

  function wire() {
    apply();
    const refreshOnCommit = (event) => {
      if (event && event.type === "keydown" && event.key !== "Enter") return;
      apply();
    };
    if (els.previewTesla1) els.previewTesla1.addEventListener("click", apply);
    if (els.tesla1OrbVisibleBtn) els.tesla1OrbVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1OrbVisibleBtn, model));
    if (els.tesla1MasterBoltVisibleBtn) els.tesla1MasterBoltVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1MasterBoltVisibleBtn, masterLayer));
    if (els.tesla1HaloVisibleBtn) els.tesla1HaloVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1HaloVisibleBtn, haloLayer));
    if (els.tesla1LightningTreeVisibleBtn) els.tesla1LightningTreeVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1LightningTreeVisibleBtn, treeLayer));
    [
      els.tesla1MasterBoltMinRangeBo,
      els.tesla1MasterBoltMaxRangeBo,
      els.tesla1MasterBoltContactRadiusBo,
      els.tesla1MasterBoltPathBendAllowance,
      els.tesla1HaloFieldEnabled,
      els.tesla1HaloFieldShellRadiusBo,
      els.tesla1HaloFieldBoltStartMinBo,
      els.tesla1HaloFieldBoltStartMaxBo,
      els.tesla1HaloFieldBoltEndMinBo,
      els.tesla1HaloFieldBoltEndMaxBo,
      els.tesla1HaloTargetMinRangeBo,
      els.tesla1HaloTargetMaxRangeBo,
      els.tesla1HaloContactRadiusBo,
      els.tesla1HaloFieldZMinBo,
      els.tesla1HaloFieldZMaxBo,
      els.tesla1LightningTreeBoltCountMin,
      els.tesla1LightningTreeBoltCountMax,
      els.tesla1LightningTreeFrequencyMinMs,
      els.tesla1LightningTreeFrequencyMaxMs,
      els.tesla1LightningTreeTtlMinMs,
      els.tesla1LightningTreeTtlMaxMs,
      els.tesla1LightningTreeSubdivisions,
      els.tesla1LightningTreeDisplacementBo,
      els.tesla1LightningTreeDisplacementDecay,
      els.tesla1LightningTreeSmoothing,
      els.tesla1LightningTreeNoiseSpeedHz,
      els.tesla1LightningTreeForkChance,
      els.tesla1LightningTreeForkDepth,
      els.tesla1LightningTreeBranchChance,
      els.tesla1LightningTreeBranchLengthMinBo,
      els.tesla1LightningTreeBranchLengthMaxBo,
      els.tesla1BoltShaderEnabled,
      els.tesla1BoltShaderCoreWidthMinBo,
      els.tesla1BoltShaderCoreWidthMaxBo,
      els.tesla1BoltShaderGlowWidthMinBo,
      els.tesla1BoltShaderGlowWidthMaxBo,
      els.tesla1BoltShaderLengthTaper,
      els.tesla1BoltShaderTipOpacity,
      els.tesla1BoltShaderCoreIntensity,
      els.tesla1BoltShaderCoreSoftness,
      els.tesla1BoltShaderGlowIntensity,
      els.tesla1BoltShaderGlowSoftness,
      els.tesla1BoltShaderFlickerSpeedHz,
      els.tesla1BoltShaderFlickerDepth,
      els.tesla1BoltShaderCentralCoreEnabled,
      els.tesla1BoltShaderCentralCoreRadiusBo,
      els.tesla1BoltShaderCentralCoreGlowRadiusBo,
      els.tesla1BoltShaderCentralCoreNoiseScale,
      els.tesla1BoltShaderCentralCoreNoiseSpeed,
      els.tesla1BoltShaderCentralCoreIntensity,
      els.tesla1BoltShaderCentralCoreSoftness,
      els.tesla1BoltShaderCoreR,
      els.tesla1BoltShaderCoreG,
      els.tesla1BoltShaderCoreB,
      els.tesla1BoltShaderCoreA,
      els.tesla1BoltShaderGlowR,
      els.tesla1BoltShaderGlowG,
      els.tesla1BoltShaderGlowB,
      els.tesla1BoltShaderGlowA,
    ].forEach((field) => {
      if (!field) return;
      field.addEventListener("keydown", refreshOnCommit);
      field.addEventListener("change", refreshOnCommit);
      field.addEventListener("blur", refreshOnCommit);
    });
  }

  return Object.freeze({
    apply,
    clear,
    play: apply,
    wire,
  });
}
