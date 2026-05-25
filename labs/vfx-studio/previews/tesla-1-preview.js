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
const MAX_HALO_BOLTS = 32;
const TESLA_HALO_INTERNAL_LINE_WIDTH_BO = 0.012;
const TESLA_SHADER_TIME_RING_SECONDS = 32;

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

function buildLightningFieldUniformValues({
  boltCountMin,
  boltCountMax,
  startMin,
  startMax,
  endMin,
  endMax,
  bo,
  boltColor,
  intensity,
  tipFade,
  flickerHz,
  flickerDepth,
  macroNoiseScale,
  macroNoiseStrength,
  microNoiseScale,
  microNoiseStrength,
  noiseSpeedMin,
  noiseSpeedMax,
  branchDensity,
  branchLengthMin,
  branchLengthMax,
  branchAngleMin,
  branchAngleMax,
  ttlMinMs,
  ttlMaxMs,
  wanderSpeedMin,
  wanderSpeedMax,
  rpscMin,
  rpscMax,
  turnTensionMin,
  turnTensionMax,
  turnDampingMin,
  turnDampingMax,
  dispersion,
  time,
}) {
  const countMin = Math.max(0, Math.min(MAX_HALO_BOLTS, Math.round(Number(boltCountMin) || 0)));
  const countMax = Math.max(countMin, Math.min(MAX_HALO_BOLTS, Math.round(Number(boltCountMax) || countMin)));
  return {
    uBoltCountMin: countMin,
    uBoltCountMax: countMax,
    uBo: Math.max(1, bo),
    uTime: ((time % TESLA_SHADER_TIME_RING_SECONDS) + TESLA_SHADER_TIME_RING_SECONDS) % TESLA_SHADER_TIME_RING_SECONDS,
    uStartMin: startMin,
    uStartMax: Math.max(startMin, startMax),
    uEndMin: endMin,
    uEndMax: Math.max(endMin, endMax),
    uBoltColor: boltColor,
    uLineWidth: Math.max(0.001, bo * TESLA_HALO_INTERNAL_LINE_WIDTH_BO),
    uIntensity: clampNumber(intensity, 0, 20, 6),
    uTipFade: clampNumber(tipFade, 0, 1, 0.08),
    uFlickerHz: clampNumber(flickerHz, 0, 60, 4),
    uFlickerDepth: clampNumber(flickerDepth, 0, 1, 0.5),
    uMacroNoiseScale: clampNumber(macroNoiseScale, 0.1, 200, 20),
    uMacroNoiseStrength: clampNumber(macroNoiseStrength, 0, 0.5, 0.03),
    uMicroNoiseScale: clampNumber(microNoiseScale, 0.1, 300, 42),
    uMicroNoiseStrength: clampNumber(microNoiseStrength, 0, 0.5, 0.025),
    uNoiseSpeedMin: clampNumber(noiseSpeedMin, 0, 20, 2),
    uNoiseSpeedMax: clampNumber(noiseSpeedMax, 0, 20, 3),
    uBranchDensity: clampNumber(branchDensity, 0, 1, 0),
    uBranchLengthMin: clampNumber(branchLengthMin, 0, 8 * Math.max(1, bo), 0.06 * Math.max(1, bo)),
    uBranchLengthMax: clampNumber(branchLengthMax, 0, 8 * Math.max(1, bo), 0.22 * Math.max(1, bo)),
    uBranchAngleMin: clampNumber(branchAngleMin, 0, 170, 35) * Math.PI / 180,
    uBranchAngleMax: clampNumber(branchAngleMax, 0, 170, 80) * Math.PI / 180,
    uTtlMin: clampNumber(ttlMinMs, 16, 10000, 350) / 1000,
    uTtlMax: clampNumber(ttlMaxMs, 16, 10000, 900) / 1000,
    uWanderSpeedMin: clampNumber(wanderSpeedMin, 0, 4, 0.05),
    uWanderSpeedMax: clampNumber(wanderSpeedMax, 0, 4, 0.18),
    uRpscMin: clampNumber(rpscMin, 0, 1, 0.08),
    uRpscMax: clampNumber(rpscMax, 0, 1, 0.24),
    uTurnTensionMin: clampNumber(turnTensionMin, 0, 1, 0.22),
    uTurnTensionMax: clampNumber(turnTensionMax, 0, 1, 0.55),
    uTurnDampingMin: clampNumber(turnDampingMin, 0, 1, 0.04),
    uTurnDampingMax: clampNumber(turnDampingMax, 0, 1, 0.18),
    uDispersion: clampNumber(dispersion, 0, 1, 0.2),
  };
}

function updateLightningFieldMaterial(material, params) {
  if (!material || !material.uniforms) return;
  const values = buildLightningFieldUniformValues(params);
  Object.entries(values).forEach(([key, value]) => {
    if (!material.uniforms[key]) material.uniforms[key] = { value };
    else material.uniforms[key].value = value;
  });
}

function createLightningFieldMaterial(params) {
  const values = buildLightningFieldUniformValues(params);
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uBoltCountMin: { value: values.uBoltCountMin },
      uBoltCountMax: { value: values.uBoltCountMax },
      uBo: { value: values.uBo },
      uTime: { value: values.uTime },
      uStartMin: { value: values.uStartMin },
      uStartMax: { value: values.uStartMax },
      uEndMin: { value: values.uEndMin },
      uEndMax: { value: values.uEndMax },
      uBoltColor: { value: values.uBoltColor },
      uLineWidth: { value: values.uLineWidth },
      uIntensity: { value: values.uIntensity },
      uTipFade: { value: values.uTipFade },
      uFlickerHz: { value: values.uFlickerHz },
      uFlickerDepth: { value: values.uFlickerDepth },
      uMacroNoiseScale: { value: values.uMacroNoiseScale },
      uMacroNoiseStrength: { value: values.uMacroNoiseStrength },
      uMicroNoiseScale: { value: values.uMicroNoiseScale },
      uMicroNoiseStrength: { value: values.uMicroNoiseStrength },
      uNoiseSpeedMin: { value: values.uNoiseSpeedMin },
      uNoiseSpeedMax: { value: values.uNoiseSpeedMax },
      uBranchDensity: { value: values.uBranchDensity },
      uBranchLengthMin: { value: values.uBranchLengthMin },
      uBranchLengthMax: { value: values.uBranchLengthMax },
      uBranchAngleMin: { value: values.uBranchAngleMin },
      uBranchAngleMax: { value: values.uBranchAngleMax },
      uTtlMin: { value: values.uTtlMin },
      uTtlMax: { value: values.uTtlMax },
      uWanderSpeedMin: { value: values.uWanderSpeedMin },
      uWanderSpeedMax: { value: values.uWanderSpeedMax },
      uRpscMin: { value: values.uRpscMin },
      uRpscMax: { value: values.uRpscMax },
      uTurnTensionMin: { value: values.uTurnTensionMin },
      uTurnTensionMax: { value: values.uTurnTensionMax },
      uTurnDampingMin: { value: values.uTurnDampingMin },
      uTurnDampingMax: { value: values.uTurnDampingMax },
      uDispersion: { value: values.uDispersion },
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
      #define MAX_HALO_BOLTS ${MAX_HALO_BOLTS}
      uniform int uBoltCountMin;
      uniform int uBoltCountMax;
      uniform float uBo;
      uniform float uTime;
      uniform float uStartMin;
      uniform float uStartMax;
      uniform float uEndMin;
      uniform float uEndMax;
      uniform vec3 uBoltColor;
      uniform float uLineWidth;
      uniform float uIntensity;
      uniform float uTipFade;
      uniform float uFlickerHz;
      uniform float uFlickerDepth;
      uniform float uMacroNoiseScale;
      uniform float uMacroNoiseStrength;
      uniform float uMicroNoiseScale;
      uniform float uMicroNoiseStrength;
      uniform float uNoiseSpeedMin;
      uniform float uNoiseSpeedMax;
      uniform float uBranchDensity;
      uniform float uBranchLengthMin;
      uniform float uBranchLengthMax;
      uniform float uBranchAngleMin;
      uniform float uBranchAngleMax;
      uniform float uTtlMin;
      uniform float uTtlMax;
      uniform float uWanderSpeedMin;
      uniform float uWanderSpeedMax;
      uniform float uRpscMin;
      uniform float uRpscMax;
      uniform float uTurnTensionMin;
      uniform float uTurnTensionMax;
      uniform float uTurnDampingMin;
      uniform float uTurnDampingMax;
      uniform float uDispersion;
      varying vec3 vWorldPosition;
      const float TIME_RING = 32.0;
      const float SNAPSHOT_RING = 64.0;

      mat2 rotate2(float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return mat2(c, -s, s, c);
      }

      float randomFloat(vec2 seed) {
        seed = sin(seed * vec2(123.45, 546.23)) * 345.21 + 12.57;
        return fract(seed.x * seed.y);
      }

      float simpleNoise(vec2 uv, float octaves) {
        float sn = 0.0;
        float amplitude = 1.0;
        float deno = 0.0;
        octaves = clamp(octaves, 1.0, 6.0);
        for (float i = 1.0; i <= 6.0; i += 1.0) {
          if (i > octaves) break;
          vec2 grid = smoothstep(vec2(0.0), vec2(1.0), fract(uv));
          vec2 id = floor(uv);
          vec2 offs = vec2(0.0, 1.0);
          float bl = randomFloat(id);
          float br = randomFloat(id + offs.yx);
          float tl = randomFloat(id + offs);
          float tr = randomFloat(id + offs.yy);
          sn += mix(mix(bl, br, grid.x), mix(tl, tr, grid.x), grid.y) * amplitude;
          deno += amplitude;
          uv *= 3.5;
          amplitude *= 0.5;
        }
        return sn / max(0.0001, deno);
      }

      float stableFrame(float value) {
        return mod(floor(value), SNAPSHOT_RING);
      }

      vec2 snapshotOffset(float seed, float frame) {
        return vec2(
          randomFloat(vec2(seed * 0.73 + 11.0, frame + 3.0)),
          randomFloat(vec2(seed * 1.17 + 29.0, frame + 17.0))
        ) * 64.0;
      }

      float lineSdf(vec2 p, vec2 a, vec2 b, float width, out float h) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        h = clamp(dot(pa, ba) / max(0.00001, dot(ba, ba)), 0.0, 1.0);
        return length(pa - ba * h) - width;
      }

      float mixAngle(float a, float b, float amount) {
        float delta = atan(sin(b - a), cos(b - a));
        return a + delta * amount;
      }

      vec3 proceduralBolt(vec2 p, float angle, float startR, float len, float seed) {
        vec2 uv = rotate2(angle) * p;
        uv.y -= startR;
        float h = 0.0;
        vec2 macroNoiseUv = uv / max(1.0, uBo) * uMacroNoiseScale;
        vec2 microNoiseUv = uv / max(1.0, uBo) * uMicroNoiseScale;
        float shapeHz = mix(uNoiseSpeedMin, max(uNoiseSpeedMin, uNoiseSpeedMax), randomFloat(vec2(seed, 173.0)));
        float shapeClock = mod(uTime * shapeHz, TIME_RING);
        float shapeFrame = stableFrame(shapeClock);
        float nextShapeFrame = mod(shapeFrame + 1.0, TIME_RING);
        float shapeBlend = smoothstep(0.0, 1.0, fract(shapeClock));
        float macroA = simpleNoise(macroNoiseUv + snapshotOffset(seed, shapeFrame), 2.0);
        float macroB = simpleNoise(macroNoiseUv + snapshotOffset(seed, nextShapeFrame), 2.0);
        float microA = simpleNoise(microNoiseUv + snapshotOffset(seed + 401.0, shapeFrame), 2.0);
        float microB = simpleNoise(microNoiseUv + snapshotOffset(seed + 401.0, nextShapeFrame), 2.0);
        float macro = mix(macroA, macroB, shapeBlend) * 2.0 - 1.0;
        float micro = mix(microA, microB, shapeBlend) * 2.0 - 1.0;
        float tipAnchorStart = max(0.0, len - uBo * 0.18);
        float tipAnchor = 1.0 - smoothstep(tipAnchorStart, len, clamp(uv.y, 0.0, len));
        float baseAnchor = smoothstep(0.0, uBo * 0.2, uv.y);
        uv.x += (macro * uMacroNoiseStrength + micro * uMicroNoiseStrength) * uBo * baseAnchor * tipAnchor;
        float d = lineSdf(uv, vec2(0.0, 0.0), vec2(0.0, len), uLineWidth * 0.006, h);
        float line = 0.1 / max(max(d / max(1.0, uBo), 0.0), 0.0001);
        vec3 bolt = clamp(1.0 - exp(-(line * uBoltColor) * 0.02), 0.0, 1.0);
        bolt *= smoothstep(len, len * (1.0 - uTipFade), abs(uv.y));

        for (int branchIndex = 0; branchIndex < 3; branchIndex += 1) {
          float bi = float(branchIndex);
          float branchSeed = seed + bi * 23.17;
          if (randomFloat(vec2(branchSeed, 311.0)) > uBranchDensity) continue;
          float anchorT = mix(0.18, 0.82, randomFloat(vec2(branchSeed, 317.0)));
          float side = randomFloat(vec2(branchSeed, 331.0)) < 0.5 ? -1.0 : 1.0;
          float branchLen = mix(uBranchLengthMin, max(uBranchLengthMin, uBranchLengthMax), randomFloat(vec2(branchSeed, 337.0)));
          float branchAngle = side * mix(uBranchAngleMin, max(uBranchAngleMin, uBranchAngleMax), randomFloat(vec2(branchSeed, 347.0)));
          vec2 branchUv = rotate2(-branchAngle) * (uv - vec2(0.0, len * anchorT));
          float branchNoiseFrame = stableFrame(uTime * max(1.0, uNoiseSpeedMin) + bi * 5.0);
          vec2 branchMacroUv = branchUv / max(1.0, uBo) * uMacroNoiseScale;
          vec2 branchMicroUv = branchUv / max(1.0, uBo) * uMicroNoiseScale;
          float branchMacro = simpleNoise(branchMacroUv + snapshotOffset(branchSeed, branchNoiseFrame), 2.0) * 2.0 - 1.0;
          float branchMicro = simpleNoise(branchMicroUv + snapshotOffset(branchSeed + 401.0, branchNoiseFrame), 2.0) * 2.0 - 1.0;
          float branchTipAnchorStart = max(0.0, branchLen - uBo * 0.12);
          float branchTipAnchor = 1.0 - smoothstep(branchTipAnchorStart, branchLen, clamp(branchUv.y, 0.0, branchLen));
          float branchBaseAnchor = smoothstep(0.0, uBo * 0.12, branchUv.y);
          branchUv.x += (branchMacro * uMacroNoiseStrength + branchMicro * uMicroNoiseStrength) * uBo * branchBaseAnchor * branchTipAnchor;
          float branchH = 0.0;
          float branchD = lineSdf(branchUv, vec2(0.0), vec2(0.0, branchLen), uLineWidth * 0.0045, branchH);
          float branchLine = 0.08 / max(max(branchD / max(1.0, uBo), 0.0), 0.0001);
          vec3 branchBolt = clamp(1.0 - exp(-(branchLine * uBoltColor) * 0.018), 0.0, 1.0);
          branchBolt *= smoothstep(branchLen, branchLen * 0.65, abs(branchUv.y));
          branchBolt *= smoothstep(0.02, 0.14, anchorT) * smoothstep(0.98, 0.78, anchorT);
          bolt += branchBolt * 0.72;
        }

        float flickerTime = mod(uTime, TIME_RING);
        float flicker = 1.0 - uFlickerDepth * (0.5 + 0.5 * sin(flickerTime * uFlickerHz * 6.2831853 + seed * 2.31));
        return bolt * flicker;
      }

      void main() {
        vec2 p = vWorldPosition.xy;
        vec3 color = vec3(0.0);
        float minCount = float(min(uBoltCountMin, uBoltCountMax));
        float maxCount = float(max(uBoltCountMin, uBoltCountMax));
        float optionalSlots = max(0.0, maxCount - minCount);
        for (int i = 0; i < MAX_HALO_BOLTS; i += 1) {
          if (float(i) >= maxCount) break;
          float fi = float(i);
          float baseTtl = max(0.016, uTtlMin);
          float maxTtl = max(baseTtl, uTtlMax);
          float offset = randomFloat(vec2(fi, 9.0)) * maxTtl;
          float shiftedTime = mod(uTime + offset, maxTtl * TIME_RING);
          float coarseCycle = stableFrame(shiftedTime / maxTtl);
          float ttl = mix(baseTtl, maxTtl, randomFloat(vec2(fi * 17.7, coarseCycle + 41.0)));
          float ttlCycle = stableFrame(shiftedTime / ttl);
          float ttlAge = mod(shiftedTime, ttl);
          float seed = fi * 37.13 + ttlCycle * 19.7 + 11.7;
          float activeRoll = randomFloat(vec2(seed, 23.0));
          float optionalChance = optionalSlots > 0.0 ? 0.5 : 0.0;
          if (fi >= minCount && activeRoll > optionalChance) continue;
          float direction = randomFloat(vec2(seed, 53.0)) < 0.5 ? -1.0 : 1.0;
          float wanderSpeed = mix(uWanderSpeedMin, max(uWanderSpeedMin, uWanderSpeedMax), randomFloat(vec2(seed, 71.0)));
          float rpsc = mix(uRpscMin, max(uRpscMin, uRpscMax), randomFloat(vec2(seed, 83.0)));
          float tension = mix(uTurnTensionMin, max(uTurnTensionMin, uTurnTensionMax), randomFloat(vec2(seed, 107.0)));
          float damping = mix(uTurnDampingMin, max(uTurnDampingMin, uTurnDampingMax), randomFloat(vec2(seed, 131.0)));
          float velocity = direction * wanderSpeed;
          float phaseSeconds = 0.0;
          float segmentStart = 0.0;
          float tickSeconds = 0.125;
          for (int s = 0; s < 48; s += 1) {
            float segmentEnd = min(ttlAge, float(s + 1) * tickSeconds);
            if (segmentEnd > segmentStart) {
              velocity += (direction * wanderSpeed - velocity) * tension;
              velocity *= 1.0 - damping * tickSeconds;
              phaseSeconds += velocity * (segmentEnd - segmentStart);
            }
            if (ttlAge <= segmentEnd) break;
            if (randomFloat(vec2(seed, 97.0 + float(s))) < rpsc * tickSeconds) direction *= -1.0;
            segmentStart = segmentEnd;
          }
          float randomAngle = randomFloat(vec2(seed, fi + 3.17)) * 6.2831853;
          float evenAngle = (fi + 0.5 * randomFloat(vec2(seed, 149.0))) / max(1.0, maxCount) * 6.2831853;
          float angle = mixAngle(randomAngle, evenAngle, uDispersion) + phaseSeconds * 6.2831853;
          float startR = mix(uStartMin, uStartMax, randomFloat(vec2(seed, 7.0)));
          float lengthSlotCount = max(1.0, minCount);
          float lengthSlotOffset = floor(randomFloat(vec2(seed, 193.0)) * lengthSlotCount);
          float lengthSlot = mod(fi + lengthSlotOffset, lengthSlotCount);
          float lengthRoll = (lengthSlot + randomFloat(vec2(seed, 191.0))) / lengthSlotCount;
          float endR = mix(uEndMin, uEndMax, lengthRoll);
          float len = max(0.001 * uBo, endR - startR);
          color += proceduralBolt(p, angle, startR, len, seed) * uIntensity;
        }
        color = 1.0 - exp(-color * 0.55);
        float alpha = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
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
  let haloShellMesh = null;
  let haloShellRadius = 0;
  let shapeLayer = null;
  let fieldMesh = null;
  let fieldPlaneSize = 0;
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
    haloShellMesh = null;
    haloShellRadius = 0;
    shapeLayer = null;
    fieldMesh = null;
    fieldPlaneSize = 0;
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

  function readShapeConfig() {
    const boltMin = Math.round(readInputNumber(els.tesla1HaloBoltCountMin, 4, 0, 256));
    const boltMax = Math.round(readInputNumber(els.tesla1HaloBoltCountMax, 12, boltMin, 256));
    const ttlMinMs = Math.round(readInputNumber(els.tesla1HaloBoltTtlMinMs, 350, 16, 10000));
    const ttlMaxMs = Math.round(readInputNumber(els.tesla1HaloBoltTtlMaxMs, 900, ttlMinMs, 10000));
    const wanderSpeedMin = readInputNumber(els.tesla1HaloBoltWanderSpeedMin, 0.05, 0, 4);
    const wanderSpeedMax = readInputNumber(els.tesla1HaloBoltWanderSpeedMax, 0.18, wanderSpeedMin, 4);
    const rpscMin = readInputNumber(els.tesla1HaloBoltRpscMin, 0.08, 0, 1);
    const rpscMax = readInputNumber(els.tesla1HaloBoltRpscMax, 0.24, rpscMin, 1);
    const turnTensionMin = readInputNumber(els.tesla1HaloBoltTurnTensionMin, 0.22, 0, 1);
    const turnTensionMax = readInputNumber(els.tesla1HaloBoltTurnTensionMax, 0.55, turnTensionMin, 1);
    const turnDampingMin = readInputNumber(els.tesla1HaloBoltTurnDampingMin, 0.04, 0, 1);
    const turnDampingMax = readInputNumber(els.tesla1HaloBoltTurnDampingMax, 0.18, turnDampingMin, 1);
    const dispersion = readInputNumber(els.tesla1HaloBoltDispersion, 0.2, 0, 1);
    const noiseSpeedMin = readInputNumber(els.tesla1LightningShapeNoiseSpeedMin, 2, 0, 20);
    const branchLengthMin = readInputNumber(els.tesla1LightningShapeBranchLengthMinBo, 0.06, 0, 8);
    const branchAngleMin = readInputNumber(els.tesla1LightningShapeBranchAngleMinDeg, 35, 0, 170);
    return Object.freeze({
      boltCountMin: boltMin,
      boltCountMax: boltMax,
      ttlMinMs,
      ttlMaxMs,
      wanderSpeedMin,
      wanderSpeedMax,
      rpscMin,
      rpscMax,
      turnTensionMin,
      turnTensionMax,
      turnDampingMin,
      turnDampingMax,
      dispersion,
      macroNoiseScale: readInputNumber(els.tesla1LightningShapeMacroNoiseScale, 7, 0.1, 200),
      macroNoiseStrength: readInputNumber(els.tesla1LightningShapeMacroNoiseStrength, 0.15, 0, 0.5),
      microNoiseScale: readInputNumber(els.tesla1LightningShapeMicroNoiseScale, 42, 0.1, 300),
      microNoiseStrength: readInputNumber(els.tesla1LightningShapeMicroNoiseStrength, 0.025, 0, 0.5),
      noiseSpeedMin,
      noiseSpeedMax: readInputNumber(els.tesla1LightningShapeNoiseSpeedMax, 3, noiseSpeedMin, 20),
      branchDensity: readInputNumber(els.tesla1LightningShapeBranchDensity, 0, 0, 1),
      branchLengthMin,
      branchLengthMax: readInputNumber(els.tesla1LightningShapeBranchLengthMaxBo, 0.22, branchLengthMin, 8),
      branchAngleMin,
      branchAngleMax: readInputNumber(els.tesla1LightningShapeBranchAngleMaxDeg, 80, branchAngleMin, 170),
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
    haloLayer.visible = !els.tesla1HaloVisibleBtn || els.tesla1HaloVisibleBtn.getAttribute("aria-pressed") !== "false";
    if (!readInputBoolean(els.tesla1HaloFieldEnabled, true)) {
      if (haloShellMesh) {
        haloLayer.remove(haloShellMesh);
        disposeObject(haloShellMesh);
        haloShellMesh = null;
        haloShellRadius = 0;
      }
      return;
    }
    const radius = readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32) * bo;
    if (!haloShellMesh) {
      haloShellMesh = new THREE.Mesh(
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
      haloShellMesh.name = "tesla1:halo_envelope";
      haloShellMesh.renderOrder = 210;
      haloLayer.add(haloShellMesh);
      haloShellRadius = radius;
      return;
    }
    if (Math.abs(haloShellRadius - radius) > 0.5) {
      if (haloShellMesh.geometry && typeof haloShellMesh.geometry.dispose === "function") haloShellMesh.geometry.dispose();
      haloShellMesh.geometry = new THREE.SphereGeometry(radius, 32, 16);
      haloShellRadius = radius;
    }
  }

  function syncShapeLayer(bo, time) {
    if (!shapeLayer) return;
    shapeLayer.visible = !els.tesla1LightningShapeVisibleBtn || els.tesla1LightningShapeVisibleBtn.getAttribute("aria-pressed") !== "false";
    const shape = readShapeConfig();
    const startMin = readInputNumber(els.tesla1HaloFieldBoltStartMinBo, 0, 0, 32);
    const startMax = readInputNumber(els.tesla1HaloFieldBoltStartMaxBo, 0.15, startMin, 32);
    const endMin = readInputNumber(els.tesla1HaloFieldBoltEndMinBo, 1.1, Math.max(0.01, startMin), 32);
    const endMax = readInputNumber(els.tesla1HaloFieldBoltEndMaxBo, 1.6, endMin, 32);
    if (!readInputBoolean(els.tesla1BoltShaderEnabled, true)) {
      clearLayer(shapeLayer);
      fieldMesh = null;
      fieldPlaneSize = 0;
      return;
    }
    const boltColor = rgbColor(els.tesla1BoltShaderColorR && els.tesla1BoltShaderColorR.value, els.tesla1BoltShaderColorG && els.tesla1BoltShaderColorG.value, els.tesla1BoltShaderColorB && els.tesla1BoltShaderColorB.value);
    const maxRangeBo = Math.max(endMax, ORB_RADIUS_BO + startMax, readInputNumber(els.tesla1HaloFieldShellRadiusBo, 1.5, 0.5, 32));
    const planeSize = bo * Math.max(2.5, maxRangeBo * 2.45);
    const materialParams = {
      boltCountMin: shape.boltCountMin,
      boltCountMax: shape.boltCountMax,
      startMin: bo * (ORB_RADIUS_BO + startMin),
      startMax: bo * (ORB_RADIUS_BO + startMax),
      endMin: bo * endMin,
      endMax: bo * endMax,
      bo,
      boltColor,
      intensity: readInputNumber(els.tesla1BoltShaderIntensity, 6, 0, 20),
      tipFade: readInputNumber(els.tesla1BoltShaderTipFade, 0.08, 0, 1),
      flickerHz: readInputNumber(els.tesla1BoltShaderFlickerSpeedHz, 4, 0, 60),
      flickerDepth: readInputNumber(els.tesla1BoltShaderFlickerDepth, 0.5, 0, 1),
      macroNoiseScale: shape.macroNoiseScale,
      macroNoiseStrength: shape.macroNoiseStrength,
      microNoiseScale: shape.microNoiseScale,
      microNoiseStrength: shape.microNoiseStrength,
      noiseSpeedMin: shape.noiseSpeedMin,
      noiseSpeedMax: shape.noiseSpeedMax,
      branchDensity: shape.branchDensity,
      branchLengthMin: bo * shape.branchLengthMin,
      branchLengthMax: bo * shape.branchLengthMax,
      branchAngleMin: shape.branchAngleMin,
      branchAngleMax: shape.branchAngleMax,
      ttlMinMs: shape.ttlMinMs,
      ttlMaxMs: shape.ttlMaxMs,
      wanderSpeedMin: shape.wanderSpeedMin,
      wanderSpeedMax: shape.wanderSpeedMax,
      rpscMin: shape.rpscMin,
      rpscMax: shape.rpscMax,
      turnTensionMin: shape.turnTensionMin,
      turnTensionMax: shape.turnTensionMax,
      turnDampingMin: shape.turnDampingMin,
      turnDampingMax: shape.turnDampingMax,
      dispersion: shape.dispersion,
      time,
    };
    if (!fieldMesh || !fieldMesh.parent) {
      clearLayer(shapeLayer);
      const material = createLightningFieldMaterial(materialParams);
      fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize, 1, 1), material);
      fieldMesh.name = "tesla1:sdf_lightning_field";
      fieldMesh.renderOrder = 214;
      fieldPlaneSize = planeSize;
      shapeLayer.add(fieldMesh);
      return;
    }
    updateLightningFieldMaterial(fieldMesh.material, materialParams);
    if (Math.abs(fieldPlaneSize - planeSize) > 0.5) {
      if (fieldMesh.geometry && typeof fieldMesh.geometry.dispose === "function") fieldMesh.geometry.dispose();
      fieldMesh.geometry = new THREE.PlaneGeometry(planeSize, planeSize, 1, 1);
      fieldPlaneSize = planeSize;
    }
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
        syncHaloLayer(bo);
        syncShapeLayer(bo, time);
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
      includeRibs: false,
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
    shapeLayer = new THREE.Group();
    shapeLayer.name = "tesla1:lightning_shape_layer";
    inspector.scene.add(new THREE.AmbientLight(0xffffff, 0.035));
    inspector.scene.add(model);
    inspector.scene.add(haloLayer);
    inspector.scene.add(shapeLayer);
    inspector.scene.add(masterLayer);
    syncMasterLayer(bo, 0);
    syncHaloLayer(bo);
    syncShapeLayer(bo, 0);
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
    if (els.tesla1LightningShapeVisibleBtn) els.tesla1LightningShapeVisibleBtn.addEventListener("click", () => toggleLayer(els.tesla1LightningShapeVisibleBtn, shapeLayer));
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
      els.tesla1HaloBoltCountMin,
      els.tesla1HaloBoltCountMax,
      els.tesla1HaloBoltTtlMinMs,
      els.tesla1HaloBoltTtlMaxMs,
      els.tesla1HaloBoltWanderSpeedMin,
      els.tesla1HaloBoltWanderSpeedMax,
      els.tesla1HaloBoltRpscMin,
      els.tesla1HaloBoltRpscMax,
      els.tesla1HaloBoltTurnTensionMin,
      els.tesla1HaloBoltTurnTensionMax,
      els.tesla1HaloBoltTurnDampingMin,
      els.tesla1HaloBoltTurnDampingMax,
      els.tesla1HaloBoltDispersion,
      els.tesla1LightningShapeMacroNoiseScale,
      els.tesla1LightningShapeMacroNoiseStrength,
      els.tesla1LightningShapeMicroNoiseScale,
      els.tesla1LightningShapeMicroNoiseStrength,
      els.tesla1LightningShapeNoiseSpeedMin,
      els.tesla1LightningShapeNoiseSpeedMax,
      els.tesla1LightningShapeBranchDensity,
      els.tesla1LightningShapeBranchLengthMinBo,
      els.tesla1LightningShapeBranchLengthMaxBo,
      els.tesla1LightningShapeBranchAngleMinDeg,
      els.tesla1LightningShapeBranchAngleMaxDeg,
      els.tesla1BoltShaderEnabled,
      els.tesla1BoltShaderIntensity,
      els.tesla1BoltShaderTipFade,
      els.tesla1BoltShaderFlickerSpeedHz,
      els.tesla1BoltShaderFlickerDepth,
      els.tesla1BoltShaderColorR,
      els.tesla1BoltShaderColorG,
      els.tesla1BoltShaderColorB,
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
